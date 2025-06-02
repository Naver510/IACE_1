let chart;
let selectedSensorId = null;
let refreshInterval = null;
let mainViewRefreshInterval = null;

const SENSOR_LABELS = {
  1: { name: 'Temperatura', unit: '°C' },
  2: { name: 'Prędkość obrotowa', unit: 'RPM' },
  3: { name: 'Ciśnienie', unit: 'hPa' },
  4: { name: 'Wilgotność', unit: '%' }
};

const safezones = new Array(4)

function fetchSensorData(sensorId, from = null, to = null) {
  let url = `http://127.0.0.1:3000/sensor/${sensorId}/data`;
  if (from && to) {
    url += `?from=${from}&to=${to}`;
  }
  // Dodaj zapamiętanie ostatniego zakresu czasowego
  window.lastFetchFrom = from;
  window.lastFetchTo = to;
  fetch(url)
    .then(response => response.json())
    .then(data => {
      renderChart(data, true);
    })
    .catch(error => {
      console.error("Błąd pobierania danych:", error);
    });
}

function fetchSensorsSafeZone() {
  for (let i = 1; i <= 4; i++) {
    fetch(`http://127.0.0.1:3000/sensor/${i}/safezone`)
      .then(response => response.json())
      .then(data => {
        safezones[i-1] = data
      })
      .catch(error => {
        console.error(`Błąd pobierania danych dla sensora ${i}:`, error);
      });
  }
}

function updateMainViewSensorValues() {
  for (let i = 1; i <= 4; i++) {
    fetch(`http://127.0.0.1:3000/sensor/${i}/data`)
      .then(response => response.json())
      .then(data => {
        const latestValue = data.length > 0 ? data[data.length - 1].value : '--';
        const valueElement = document.getElementById(`sensor-value-${i}`);
        if (latestValue > safezones[i-1]['max']) {
          valueElement?.parentElement?.setAttribute('class','sensor warning')
        }
        else if (latestValue < safezones[i-1]['min']) {
          valueElement?.parentElement?.setAttribute('class','sensor warning') 
        }
        else{
          valueElement?.parentElement?.setAttribute('class','sensor') 
        }
        valueElement.textContent = latestValue;
      })
      .catch(error => {
        console.error(`Błąd pobierania danych dla sensora ${i}:`, error);
        document.getElementById(`sensor-value-${i}`).textContent = '--';
      });
  }
}

function showDetail(sensorId) {
  selectedSensorId = sensorId;
  document.getElementById("main-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";

  if (chart) {
    chart.destroy();
    chart = null;
  }

  // Przy wejściu w szczegóły sensora, nie odświeżaj automatycznie wykresu jeśli był wybrany zakres
  if (window.lastRangeMode && window.lastFetchFrom && window.lastFetchTo) {
    fetchSensorData(sensorId, window.lastFetchFrom, window.lastFetchTo);
  } else {
    fetchSensorData(sensorId);
  }

  if (mainViewRefreshInterval) { mainViewRefreshInterval = clearInterval(mainViewRefreshInterval) };

  if (refreshInterval) { refreshInterval = clearInterval(refreshInterval); }
  refreshInterval = setInterval(() => {
    // Odświeżaj tylko dla bieżącego zakresu, jeśli jest ustawiony
    if (window.lastRangeMode && window.lastFetchFrom && window.lastFetchTo) {
      fetchSensorData(sensorId, window.lastFetchFrom, window.lastFetchTo);
    } else {
      fetchSensorData(sensorId);
    }
  }, 2000);
}

function showMainView() {
  document.getElementById("detail-view").style.display = "none";
  document.getElementById("main-view").style.display = "block";
  selectedSensorId = null;

  if (chart) {
    chart.destroy();
    chart = null;
  }

  if (refreshInterval) {
    refreshInterval = clearInterval(refreshInterval);
  }

  updateMainViewSensorValues();
  if (!mainViewRefreshInterval) {
    mainViewRefreshInterval = setInterval(updateMainViewSensorValues, 2000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchSensorsSafeZone()
  updateMainViewSensorValues();
  mainViewRefreshInterval = setInterval(updateMainViewSensorValues, 2000);

  // Dodaj obsługę kliknięcia na ikonę odświeżania
  const refreshBtn = document.querySelector('.chart-box .refresh');
  if (refreshBtn) {
    refreshBtn.onclick = refreshChart;
  }
});

function renderChart(data, animate = true) {
  const ctx = document.getElementById("sensorChart").getContext("2d");
  let labels, values;

  if (window.lastRangeMode === 'yesterday') {
    // Wyciągnij po jednym wyniku na każdą godzinę (najbliższy do pełnej godziny)
    const byHour = new Array(24).fill(null);
    data.forEach(entry => {
      const d = new Date(entry.timestamp * 1000);
      const hour = d.getHours();
      if (!byHour[hour]) {
        byHour[hour] = entry;
      }
    });
    const filtered = byHour.filter(Boolean);
    labels = filtered.map(entry =>
      new Date(entry.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    values = filtered.map(entry => entry.value);
  } else if (window.lastRangeMode === 'last7days') {
    // Wyciągnij po 4 wyniki na każdy dzień z ostatnich 7 dni
    const byDay = {};
    data.forEach(entry => {
      const d = new Date(entry.timestamp * 1000);
      const dayKey = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
      if (!byDay[dayKey]) byDay[dayKey] = [];
      if (byDay[dayKey].length < 4) byDay[dayKey].push(entry);
    });
    const filtered = [];
    Object.keys(byDay).sort().forEach(day => {
      filtered.push(...byDay[day]);
    });
    labels = filtered.map(entry =>
      new Date(entry.timestamp * 1000).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    );
    values = filtered.map(entry => entry.value);
  } else if (window.lastRangeMode === 'range') {
    // Pokaz po 4 wyniki na każdy dzień z wybranego zakresu
    const byDay = {};
    data.forEach(entry => {
      const d = new Date(entry.timestamp * 1000);
      const dayKey = d.getFullYear() + '-' + (d.getMonth()+1).toString().padStart(2,'0') + '-' + d.getDate().toString().padStart(2,'0');
      if (!byDay[dayKey]) byDay[dayKey] = [];
      if (byDay[dayKey].length < 4) byDay[dayKey].push(entry);
    });
    const filtered = [];
    Object.keys(byDay).sort().forEach(day => {
      filtered.push(...byDay[day]);
    });
    labels = filtered.map(entry =>
      new Date(entry.timestamp * 1000).toLocaleString([], { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    );
    values = filtered.map(entry => entry.value);
  } else if (data.length > 0 && data.length <= 40) {
    labels = data.map(entry =>
      new Date(entry.timestamp * 1000).toLocaleTimeString()
    );
    values = data.map(entry => entry.value);
  } else if (data.length > 40 && window.lastRangeMode === 'range') {
    // tryb zakresu: pokaz co 100-ty odczyt
    const sampled = [];
    for (let i = 0; i < data.length; i += 100) {
      sampled.push(data[i]);
    }
    if (data.length % 100 !== 0 && data.length > 0 && sampled[sampled.length - 1] !== data[data.length - 1]) {
      sampled.push(data[data.length - 1]);
    }
    labels = sampled.map(entry =>
      new Date(entry.timestamp * 1000).toLocaleString()
    );
    values = sampled.map(entry => entry.value);
  } else {
    // domyślnie pokazuj tylko ostatnie 40
    const recentData = data.slice(-40);
    labels = recentData.map(entry =>
      new Date(entry.timestamp * 1000).toLocaleTimeString()
    );
    values = recentData.map(entry => entry.value);
  }

  if (!chart) {
    chart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `${SENSOR_LABELS[selectedSensorId].name}`,
            data: values,
            borderColor: "#ffffff",
            backgroundColor: "rgba(255,255,255,0.2)",
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        animation: {
          duration: animate ? 750 : 0
        },
        scales: {
          x: {
            ticks: { color: "#fff" },
            grid: {
              color: "rgba(255,255,255,0.1)"
            }
          },
          y: {
            ticks: { color: "#fff" },
            grid: {
              color: "rgba(255,255,255,0.1)"
            },
            beginAtZero: true,
            title: {
              display: true,
              text: SENSOR_LABELS[selectedSensorId].unit,
              color: '#fff'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: "#fff"
            }
          }
        }
      }
    });
  } else {
    chart.data.labels = labels;
    chart.data.datasets[0].data = values;
    chart.data.datasets[0].label = `${SENSOR_LABELS[selectedSensorId].name}`;
    chart.options.scales.y.title.text = SENSOR_LABELS[selectedSensorId].unit;
    chart.update('active');
  }
}

function refreshChart() {
  if (selectedSensorId !== null) {
    // Przy odświeżaniu wykresu, odśwież ostatni wybrany zakres (jeśli był)
    if (window.lastRangeMode && window.lastFetchFrom && window.lastFetchTo) {
      fetchSensorData(selectedSensorId, window.lastFetchFrom, window.lastFetchTo);
    } else {
      fetchSensorData(selectedSensorId);
    }
  }
}

function downloadData(format) {
  if (!selectedSensorId) {
    alert('Najpierw wybierz sensor!');
    return;
  }

  const url = `http://127.0.0.1:3000/sensor/${selectedSensorId}/export?format=${format}`;
  const fileName = `sensor_${selectedSensorId}_data.${format}`;

  fetch(url)
    .then(response => {
      if (!response.ok) throw new Error('Błąd pobierania pliku');
      return response.blob();
    })
    .then(blob => {
      if (window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveBlob(blob, fileName);
      } else {
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = fileName;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
      }
    })
    .catch(error => {
      console.error('Błąd pobierania danych:', error);
      alert('Wystąpił błąd podczas pobierania danych');
    });
}

document.querySelectorAll('.buttons button').forEach((btn, idx) => {
  btn.onclick = () => {
    if (!selectedSensorId) {
      alert('Najpierw wybierz sensor!');
      return;
    }
    const now = new Date();
    let from, to;

    if (idx === 0) { // WCZORAJ
      // WCZORAJ (tylko 24 wyniki z godzin 0-23 z wczoraj)
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0,0,0,0);
      from = Math.floor(yesterday.getTime() / 1000);
      to = Math.floor(yesterday.getTime() / 1000) + 86399;
      window.lastRangeMode = 'yesterday';
      fetchSensorData(selectedSensorId, from, to);
      return;
    } else if (idx === 1) { // OSTATNIE 7 DNI
      // OSTATNIE 7 DNI (ostatnie 7 dni do teraz, po 4 wyniki na dzień)
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0,0,0,0);
      from = Math.floor(sevenDaysAgo.getTime() / 1000);
      to = Math.floor(now.getTime() / 1000);
      window.lastRangeMode = 'last7days';
      fetchSensorData(selectedSensorId, from, to);
      return;
    } else if (idx === 2) { // OSTATNIE 30 DNI
      // OSTATNIE 30 DNI (ostatnie 30 dni do teraz, po 4 wyniki na dzień)
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 29);
      thirtyDaysAgo.setHours(0,0,0,0);
      from = Math.floor(thirtyDaysAgo.getTime() / 1000);
      to = Math.floor(now.getTime() / 1000);
      window.lastRangeMode = 'last7days'; // użyj tej samej logiki renderowania (po 4 na dzień)
      fetchSensorData(selectedSensorId, from, to);
      return;
    } else if (idx === 3) { // USTAW ZAKRES
      let dni = prompt("Podaj liczbę dni (1-30):", "7");
      dni = parseInt(dni);
      if (isNaN(dni) || dni < 1 || dni > 30) {
        alert("Nieprawidłowa liczba dni!");
        return;
      }
      const start = new Date(now);
      start.setDate(now.getDate() - (dni - 1));
      start.setHours(0,0,0,0);
      from = Math.floor(start.getTime() / 1000);
      to = Math.floor(now.getTime() / 1000);
      window.lastRangeMode = 'range';
      fetchSensorData(selectedSensorId, from, to);
      return;
    }
  };
});
