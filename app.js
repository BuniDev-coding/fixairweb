document.addEventListener("DOMContentLoaded", () => {
  const client = mqtt.connect("ws://broker.emqx.io:8083/mqtt");
  const topic = "temp-humid";
  const tempCtx = document.getElementById("tempChart").getContext("2d");
  const tempData = {
    labels: [],
    datasets: [
      {
        label: "Temperature (°C)",
        borderColor: "rgb(255, 99, 132)",
        backgroundColor: "rgba(255, 99, 132, 0.5)",
        data: [],
      },
    ],
  };

  const tempConfig = {
    type: "line",
    data: tempData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
        y: {
          title: {
            display: true,
            text: "Temperature (°C)",
          },
          min: 0,
          max: 100,
        },
      },
    },
  };

  const tempChart = new Chart(tempCtx, tempConfig);
  const pmCtx = document.getElementById("pmChart").getContext("2d");
  const pmData = {
    labels: [],
    datasets: [
      {
        label: "PM (%)",
        borderColor: "rgb(54, 162, 235)",
        backgroundColor: "rgba(54, 162, 235, 0.5)",
        data: [],
      },
    ],
  };

  const pmConfig = {
    type: "line",
    data: pmData,
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Time",
          },
        },
        y: {
          title: {
            display: true,
            text: "PM (%)",
          },
          min: 0,
          max: 100,
        },
      },
    },
  };
  const pmChart = new Chart(pmCtx, pmConfig);

  client.on("connect", () => {
    console.log("Connected to MQTT broker");
    client.subscribe(topic, (err) => {
      if (!err) {
        console.log(`Subscribed to topic: ${topic}`);
      }
    });
  });
  client.on("message", (topic, message) => {
    try {
      const payload = JSON.parse(message.toString());
      console.log("Received message:", payload);

      const temperature = parseFloat(payload.temp);
      const pm = parseFloat(payload.pm);

      if (isNaN(temperature) || isNaN(pm)) {
        console.warn("Invalid data received. Temperature or PM is NaN.");
        return;
      }

      const timestamp = new Date().toLocaleTimeString();

      tempData.labels.push(timestamp);
      tempData.datasets[0].data.push(temperature);

      if (tempData.labels.length > 5) {
        tempData.labels.shift();
        tempData.datasets[0].data.shift();
      }

      tempChart.update();

      pmData.labels.push(timestamp);
      pmData.datasets[0].data.push(pm);

      if (pmData.labels.length > 5) {
        pmData.labels.shift();
        pmData.datasets[0].data.shift();
      }

      pmChart.update();

      document.getElementById("tempValue").textContent = temperature.toFixed(2);
      document.getElementById("pmValue").textContent = pm.toFixed(2);

      const tempImage = document.getElementById("tempImage");
      if (temperature < 15) {
        tempImage.src = "images/s.svg";
      } else if (temperature >= 15 && temperature <= 30) {
        tempImage.src = "images/w.svg";
      } else {
        tempImage.src = "images/h.svg";
      }
      const pmImage = document.getElementById("pmImage");
      if (pm >= 37) {
        pmImage.src = "images/a2.png";
      } else {
        pmImage.src = "images/a1.png";
      }
    } catch (error) {
      console.error("Error parsing MQTT message:", error);
    }
  });
});

function showTime() {
  const date = new Date();
  const options = {
    weekday: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  };
  const formattedDate = date.toLocaleDateString("en-US", options);
  document.getElementById("clock").textContent = formattedDate;
}
showTime();
setInterval(showTime, 1000);
