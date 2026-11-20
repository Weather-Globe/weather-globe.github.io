# 🌍 Global Weather Map

An interactive 3D globe visualizing real-time weather and 5-day forecasts for major cities around the world.

*(Optional: Add a screenshot of your project here by uploading it to GitHub and linking it below)*
<!-- ![Weather Map Preview](link-to-your-screenshot.jpg) -->

## 🚀 Key Features

- **Interactive 3D Globe:** Smooth camera controls, rotation, and precise coordinate mapping powered by CesiumJS.
- **Real-Time Weather Data:** Fetches current temperature, humidity, wind speed, and conditions globally.
- **Animated Weather Icons:** Modern, animated SVG icons (Meteocons) displayed in the UI panel.
- **5-Day Forecast Chart:** Interactive line graphs tracking max/min temperature trends using Chart.js.
- **Click-to-Search (Reverse Geocoding):** Click anywhere on the map to get the weather for that exact coordinate and identify the nearest location.
- **Global Weather Filters:** Instantly filter the map to show only cities with specific conditions (Rain, Snow, Clear, Clouds, Wind).
- **Day / Night Cycle:** Realistic sun positioning for day/night transitions, coupled with NASA's nighttime city lights layer.
- **Smart Level of Detail (LOD):** Markers intelligently appear and disappear based on camera altitude to maintain high performance and prevent screen clutter.

## 🛠 Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6+).
- **3D Engine:** [CesiumJS](https://cesium.com/platform/cesiumjs/)
- **Data Visualization:** [Chart.js](https://www.chartjs.org/)
- **Weather Icons:** [Meteocons](https://bas.dev/work/meteocons)
- **Free & Keyless APIs**:
  - [Open-Meteo](https://open-meteo.com/) (Weather & Forecast)
  - [BigDataCloud](https://www.bigdatacloud.com/) (Reverse Geocoding)
  - [NASA GIBS](https://nasa.github.io/) (Nighttime City Lights)
  - [ArcGIS](https://www.arcgis.com/) & [OpenStreetMap](https://www.openstreetmap.org/) (Map Tiles & Labels)

## 📦 How to Run Locally

Due to browser security policies (CORS), this project **will not work** if you simply double-click the `index.html` file. You need to run it through a local server.

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/global-weather-map.git
