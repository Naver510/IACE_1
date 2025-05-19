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

function fetchSensorData(sensorId) {
  console.log("Pobieram dane dla sensora:", sensorId);

  fetch(`http://127.0.0.1:3000/sensor/${sensorId}/data`)
    .then(response => response.json())
    .then(data => {
      console.log("Odebrane dane:", data);
      renderChart(data, true);
    })
    .catch(error => {
      console.error("Błąd pobierania danych:", error);
    });
}

function updateMainViewSensorValues() {
  for (let i = 1; i <= 4; i++) {
    fetch(`http://127.0.0.1:3000/sensor/${i}/data`)
      .then(response => response.json())
      .then(data => {
        const latestValue = data.length > 0 ? data[data.length - 1].value : '--';
        const valueElement = document.getElementById(`sensor-value-${i}`);
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

  fetch(`http://127.0.0.1:3000/sensor/${selectedSensorId}/data`)
    .then(response => response.json())
    .then(data => {
      let content = '';
      const sensorInfo = SENSOR_LABELS[selectedSensorId];

      if (format === 'csv') {
        content = `Timestamp,${sensorInfo.name} (${sensorInfo.unit})\n`;

        data.forEach(entry => {
          const date = new Date(entry.timestamp * 1000).toLocaleString();
          content += `${date},${entry.value}\n`;
        });
      } else {
        content = `Dane sensora: ${sensorInfo.name}\n`;
        content += `Jednostka: ${sensorInfo.unit}\n`;
        content += '='.repeat(40) + '\n';
        content += 'Data i czas          | Wartość\n';
        content += '-'.repeat(40) + '\n';

        data.forEach(entry => {
          const date = new Date(entry.timestamp * 1000).toLocaleString();
          content += `${date.padEnd(20)}| ${entry.value}\n`;
        });
      }


      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const fileName = `sensor_${selectedSensorId}_${format === 'csv' ? 'data.csv' : 'data.txt'}`;

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
