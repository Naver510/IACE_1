let chart;
let selectedSensorId = null;

function showDetail(sensorId) {
  selectedSensorId = sensorId;
  document.getElementById("main-view").style.display = "none";
  document.getElementById("detail-view").style.display = "block";
  fetchSensorData(sensorId);
}

function fetchSensorData(sensorId) {
    console.log("Pobieram dane dla sensora:", sensorId); // DEBUG
  
    fetch(`http://127.0.0.1:3000/sensor/${sensorId}/data`)
      .then(response => response.json())
      .then(data => {
        console.log("Odebrane dane:", data); // DEBUG
        renderChart(data);
      })
      .catch(error => {
        console.error("Błąd pobierania danych:", error);
      });
  }
  

function renderChart(data) {
  const ctx = document.getElementById("sensorChart").getContext("2d");

  const labels = data.map(entry =>
    new Date(entry.timestamp * 1000).toLocaleTimeString()
  );
  const values = data.map(entry => entry.value);

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Wartość sensora",
          data: values,
          borderColor: "#ffffff",
          backgroundColor: "rgba(255,255,255,0.2)",
          tension: 0.3
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: "#fff" } },
        y: { ticks: { color: "#fff" }, beginAtZero: true }
      },
      plugins: {
        legend: { labels: { color: "#fff" } }
      }
    }
  });
}

function refreshChart() {
  if (selectedSensorId !== null) {
    fetchSensorData(selectedSensorId);
  }
}
