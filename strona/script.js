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

function showDetail(sensorId) {
  selectedSensorId = sensorId;
  document.getElementById("main-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";

  if (chart) {
    chart.destroy();
    chart = null;
  }

  fetchSensorData(sensorId);

  if (mainViewRefreshInterval) { mainViewRefreshInterval = clearInterval(mainViewRefreshInterval) };

  if (refreshInterval) { refreshInterval = clearInterval(refreshInterval); }
  refreshInterval = setInterval(() => fetchSensorData(sensorId), 2000);
}

function fetchSensorData(sensorId, from = null, to = null) {
  let url = `http://127.0.0.1:3000/sensor/${sensorId}/data`;
  if (from && to) {
    url += `?from=${from}&to=${to}`;
  }
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
});

function renderChart(data, animate = true) {
  const ctx = document.getElementById("sensorChart").getContext("2d");
  const MAX_DATA_POINTS = 40;

  const recentData = data.slice(-MAX_DATA_POINTS);
  const labels = recentData.map(entry =>
    new Date(entry.timestamp * 1000).toLocaleTimeString()
  );
  const values = recentData.map(entry => entry.value);

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
    fetchSensorData(selectedSensorId);
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
    to = Math.floor(now.getTime() / 1000);

    if (idx === 0) { // WCZORAJ
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0,0,0,0);
      from = Math.floor(yesterday.getTime() / 1000);
      to = from + 86400 - 1;
    } else if (idx === 1) { // OSTATNIE 7 DNI
      from = to - 7 * 86400;
    } else if (idx === 2) { // OSTATNIE 30 DNI
      from = to - 30 * 86400;
    } else if (idx === 3) { // USTAW ZAKRES
      let dni = prompt("Podaj liczbę dni (1-30):", "7");
      dni = parseInt(dni);
      if (isNaN(dni) || dni < 1 || dni > 30) {
        alert("Nieprawidłowa liczba dni!");
        return;
      }
      from = to - dni * 86400;
    }
    fetchSensorData(selectedSensorId, from, to);
  };
});
