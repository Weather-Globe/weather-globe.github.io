// === 1. ИНИЦИАЛИЗАЦИЯ 3D-КАРТЫ (CESIUM) ===
const viewer = new Cesium.Viewer('cesiumContainer', {
    baseLayer: false, 
    terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    baseLayerPicker: false, geocoder: false, homeButton: false, sceneModePicker: false,
    navigationHelpButton: false, animation: false, timeline: false, fullscreenButton: false,
    infoBox: false, selectionIndicator: false,
    minimumZoomDistance: 100, maximumZoomDistance: 50000000
});

// 🔥 ВАЖНО: Устанавливаем реальное текущее время для Солнца
viewer.clock.currentTime = Cesium.JulianDate.now();
viewer.clock.shouldAnimate = true;

const layerScheme = new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/' });
const layerSatellite = new Cesium.UrlTemplateImageryProvider({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', maximumLevel: 19 });
const layerLabels = new Cesium.UrlTemplateImageryProvider({ url: 'https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', maximumLevel: 19 });
const layerClouds = new Cesium.WebMapServiceImageryProvider({ url: 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi', layers: 'nexrad-n0r', parameters: { transparent: true, format: 'image/png' } });

let globalCloudLayer = null;

function setMapMode(mode) {
    viewer.imageryLayers.removeAll();
    if (mode === 'scheme') viewer.imageryLayers.addImageryProvider(layerScheme);
    else if (mode === 'satellite') viewer.imageryLayers.addImageryProvider(layerSatellite);
    else if (mode === 'hybrid') {
        viewer.imageryLayers.addImageryProvider(layerSatellite);
        viewer.imageryLayers.addImageryProvider(layerLabels);
    }
    globalCloudLayer = viewer.imageryLayers.addImageryProvider(layerClouds);
    globalCloudLayer.alpha = 0.3;
    document.querySelectorAll('.map-modes button').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`mode-${mode}`).classList.add('active');
}
setMapMode('scheme');
viewer.scene.skyAtmosphere.show = true;
viewer.camera.setView({ destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000) });

document.getElementById('mode-scheme').addEventListener('click', () => setMapMode('scheme'));
document.getElementById('mode-satellite').addEventListener('click', () => setMapMode('satellite'));
document.getElementById('mode-hybrid').addEventListener('click', () => setMapMode('hybrid'));

// === 🔥 ЛОГИКА ДЕНЬ / НОЧЬ ===
const dayNightBtn = document.getElementById('toggle-day-night');
let isLightingEnabled = false;

dayNightBtn.addEventListener('click', () => {
    isLightingEnabled = !isLightingEnabled;
    viewer.scene.globe.enableLighting = isLightingEnabled;
    
    if (isLightingEnabled) {
        dayNightBtn.classList.add('active');
        dayNightBtn.textContent = '🌙 Disable Day / Night';
        
        // Делаем атмосферу и ночную сторону более реалистичными (темными)
        viewer.scene.skyAtmosphere.brightnessShift = -0.4;
        
        // Если включили ночь, лучше переключиться на спутник, чтобы было видно огни городов
        if (!document.getElementById('mode-satellite').classList.contains('active') && !document.getElementById('mode-hybrid').classList.contains('active')) {
            setMapMode('satellite');
        }
    } else {
        dayNightBtn.classList.remove('active');
        dayNightBtn.textContent = '☀️ Enable Day / Night';
        viewer.scene.skyAtmosphere.brightnessShift = 0.0;
    }
});

// === 2. ВРАЩЕНИЕ ===
let autoRotate = true;
let cloudPulseTime = 0;
let selectedCityEntity = null; 

viewer.clock.onTick.addEventListener(function() {
    const height = viewer.camera.positionCartographic.height;
    if (height < 15000000) autoRotate = false;
    else if (!selectedCityEntity) autoRotate = true;
    if (autoRotate) viewer.camera.rotate(Cesium.Cartesian3.UNIT_Z, -0.001);

    if (globalCloudLayer) {
        cloudPulseTime += 0.02;
        globalCloudLayer.alpha = 0.2 + (Math.sin(cloudPulseTime) * 0.1);
    }
});

// === 3. ПЕРЕМЕННЫЕ ===
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const loader = document.getElementById('loader');
const weatherInfo = document.getElementById('weatherInfo');
const errorMsg = document.getElementById('errorMsg');
const resetViewBtn = document.getElementById('resetViewBtn');

let allEntitiesMap = {}; 
let userLocationEntity = null;
let forecastChartInstance = null; 

const bluePinIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iIzQyODVmNCIgZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==';
const redPinIcon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0iI2VhNDMzNSIgZD0iTTEyIDJDOC4xMyAyIDUgNS4xMyA1IDljMCA1LjI1IDcgMTMgNyAxM3M3LTcuNzUgNy0xM2MwLTMuODctMy4xMy03LTctN3ptMCA5LjVjLTEuMzggMC0yLjUtMS4xMi0yLjUtMi41czEuMTItMi41IDIuNS0yLjUgMi41IDEuMTIgMi41IDIuNS0xLjEyIDIuNS0yLjUgMi41eiIvPjwvc3ZnPg==';

// === 4. ФУНКЦИИ ===
function getWeatherDetails(code) {
    const mapping = {
        0: { text: "Clear sky" }, 1: { text: "Mainly clear" }, 2: { text: "Partly cloudy" }, 3: { text: "Overcast" },
        45: { text: "Fog" }, 48: { text: "Rime fog" }, 51: { text: "Light drizzle" }, 53: { text: "Drizzle" },
        55: { text: "Dense drizzle" }, 61: { text: "Slight rain" }, 63: { text: "Rain" }, 65: { text: "Heavy rain" },
        71: { text: "Slight snow" }, 73: { text: "Snow" }, 75: { text: "Heavy snow" }, 95: { text: "Thunderstorm" }
    };
    return mapping[code] || { text: "Unknown" };
}

function getMeteoconIconUrl(code) {
    let name = 'clear-day';
    if ([0, 1].includes(code)) name = 'clear-day';
    else if ([2].includes(code)) name = 'partly-cloudy-day';
    else if ([3].includes(code)) name = 'overcast';
    else if ([45, 48].includes(code)) name = 'fog';
    else if ([51, 53, 55].includes(code)) name = 'drizzle';
    else if ([61, 63, 65].includes(code)) name = 'rain';
    else if ([71, 73, 75].includes(code)) name = 'snow';
    else if ([95].includes(code)) name = 'thunderstorms';
    return `https://cdn.jsdelivr.net/npm/@meteocons/svg@0.1.0/fill/${name}.svg`;
}

function createMarkerImage(title, value, isSelected = false, isWind = false) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const valueStr = isWind ? `${value} km/h` : `${value}°C`;
        ctx.font = isSelected ? 'bold 16px "Segoe UI", sans-serif' : 'bold 13px "Segoe UI", sans-serif';
        const maxTextWidth = Math.max(ctx.measureText(title).width, ctx.measureText(valueStr).width);
        canvas.width = maxTextWidth + 40; 
        canvas.height = 80;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const textY = canvas.height / 2 - 15;
        ctx.font = isSelected ? 'bold 16px "Segoe UI", sans-serif' : 'bold 13px "Segoe UI", sans-serif';
        const boxWidth = maxTextWidth + 20;
        const boxHeight = 36;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(canvas.width / 2 - boxWidth / 2, textY - 20, boxWidth, boxHeight, 8);
        else ctx.rect(canvas.width / 2 - boxWidth / 2, textY - 20, boxWidth, boxHeight);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#000000'; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(title, canvas.width / 2, textY - 8);
        ctx.fillText(valueStr, canvas.width / 2, textY + 8);
        
        const pinImage = new Image();
        pinImage.src = isSelected ? redPinIcon : bluePinIcon;
        pinImage.onload = () => {
            const size = isSelected ? 30 : 24;
            ctx.drawImage(pinImage, (canvas.width / 2) - (size / 2), canvas.height - size - 5, size, size);
            resolve(canvas.toDataURL());
        };
    });
}

async function loadForecast(lon, lat) {
    try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        const data = await res.json();
        
        const dates = data.daily.time.map(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        });
        const maxTemps = data.daily.temperature_2m_max.map(t => Math.round(t));
        const minTemps = data.daily.temperature_2m_min.map(t => Math.round(t));

        document.getElementById('chartContainer').style.display = 'block';
        const ctx = document.getElementById('forecastChart').getContext('2d');
        
        if (forecastChartInstance) forecastChartInstance.destroy();

        forecastChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [
                    { label: 'Max °C', data: maxTemps, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3 },
                    { label: 'Min °C', data: minTemps, borderColor: '#3b82f6', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderWidth: 2, tension: 0.4, fill: true, pointRadius: 3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0, minRotation: 0 } }, 
                    y: { grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { font: { size: 10 } } } 
                }
            }
        });
    } catch (e) { console.error("Ошибка загрузки прогноза:", e); }
}

function handleEntityClick(lon, lat, name, country, code, wind, temp, feelsLike, humidity) {
    const wDetails = getWeatherDetails(code);
    
    document.getElementById('cityName').textContent = `${name}${country ? ', ' + country : ''}`;
    document.getElementById('temperature').textContent = `${Math.round(temp)}°C`;
    document.getElementById('condition').textContent = wDetails.text;
    document.getElementById('feelsLike').textContent = feelsLike ? `${Math.round(feelsLike)}°C` : '-';
    document.getElementById('humidity').textContent = humidity ? `${humidity}%` : '-';
    document.getElementById('wind').textContent = `${wind} km/h`;

    const iconUrl = getMeteoconIconUrl(code);
    document.getElementById('weatherIconContainer').innerHTML = `<img src="${iconUrl}" alt="${wDetails.text}">`;
    weatherInfo.style.display = 'block';

    loadForecast(lon, lat);

    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 150000),
        orientation: { heading: 0.0, pitch: Cesium.Math.toRadians(-90.0), roll: 0.0 },
        duration: 4.0
    });
}

async function processMapCoordinate(lat, lon) {
    loader.style.display = 'block';
    weatherInfo.style.display = 'none';
    errorMsg.style.display = 'none';
    autoRotate = false;

    for (const key in allEntitiesMap) {
        const d = allEntitiesMap[key];
        if (d.type === 'city') {
            const dist = Math.sqrt(Math.pow(d.lon - lon, 2) + Math.pow(d.lat - lat, 2));
            if (dist < 0.5) { 
                viewer.entities.remove(d.entity);
                delete allEntitiesMap[key];
            }
        }
    }

    let placeName = "Selected Location";
    let countryName = "";
    try {
        const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const geoData = await geoRes.json();
        if (geoData.city || geoData.locality) {
            placeName = geoData.city || geoData.locality;
            countryName = geoData.countryName;
        } else if (geoData.principalSubdivision) {
            placeName = geoData.principalSubdivision;
            countryName = geoData.countryName;
        }
    } catch (e) { console.warn("Не удалось определить название места"); }

    try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`);
        const weatherData = await weatherRes.json();
        const current = weatherData.current;

        if (selectedCityEntity) viewer.entities.remove(selectedCityEntity);
        
        const selectedMarkerImage = await createMarkerImage(placeName, Math.round(current.temperature_2m), true, false);
        
        selectedCityEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(lon, lat),
            billboard: { image: selectedMarkerImage, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, scale: 1.2, disableDepthTestDistance: Number.POSITIVE_INFINITY }
        });

        loader.style.display = 'none';
        handleEntityClick(lon, lat, placeName, countryName, current.weather_code, current.wind_speed_10m, current.temperature_2m, current.apparent_temperature, current.relative_humidity_2m);

    } catch (error) {
        loader.style.display = 'none';
        errorMsg.style.display = 'block';
        errorMsg.textContent = "Could not load weather for this location.";
    }
}

const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
handler.setInputAction(function(click) {
    const pickedObject = viewer.scene.pick(click.position);

    if (Cesium.defined(pickedObject) && pickedObject.id) {
        const entity = pickedObject.id;
        for (const key in allEntitiesMap) {
            if (allEntitiesMap[key].entity === entity) {
                const data = allEntitiesMap[key];
                handleEntityClick(data.lon, data.lat, data.name, data.country, data.code, data.wind, data.temp, data.feelsLike, data.humidity);
                return;
            }
        }
    }

    const cartesian = viewer.camera.pickEllipsoid(click.position, viewer.scene.globe.ellipsoid);
    if (cartesian) {
        const cartographic = Cesium.Cartographic.fromCartesian(cartesian);
        const lon = Cesium.Math.toDegrees(cartographic.longitude);
        const lat = Cesium.Math.toDegrees(cartographic.latitude);
        processMapCoordinate(lat, lon);
    }
}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

// === 5. ЗАГРУЗКА ДАННЫХ ===
async function fetchWeatherInBatches(locations) {
    const batchSize = 15;
    const results = [];
    for (let i = 0; i < locations.length; i += batchSize) {
        const batch = locations.slice(i, i + batchSize);
        const lats = batch.map(c => c.lat).join(',');
        const lons = batch.map(c => c.lon).join(',');
        try {
            const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`);
            const data = await res.json();
            const arr = Array.isArray(data) ? data : [data];
            results.push(...arr);
        } catch (e) { console.error("Ошибка пакета:", e); }
    }
    return results;
}

async function loadHierarchy() {
    const continents = [ { name: "North America", lat: 40.7, lon: -100.0 }, { name: "South America", lat: -15.0, lon: -60.0 }, { name: "Europe", lat: 50.0, lon: 15.0 }, { name: "Africa", lat: 0.0, lon: 20.0 }, { name: "Asia", lat: 34.0, lon: 100.0 }, { name: "Australia", lat: -25.0, lon: 135.0 } ];
    const countries = [ { name: "USA", lat: 38.90, lon: -77.03, country: "Country" }, { name: "Brazil", lat: -15.79, lon: -47.89, country: "Country" }, { name: "Russia", lat: 55.75, lon: 37.61, country: "Country" }, { name: "China", lat: 39.90, lon: 116.40, country: "Country" }, { name: "Australia", lat: -35.28, lon: 149.13, country: "Country" }, { name: "India", lat: 28.61, lon: 77.20, country: "Country" }, { name: "Uzbekistan", lat: 41.29, lon: 69.24, country: "Country" }, { name: "Egypt", lat: 30.04, lon: 31.23, country: "Country" }, { name: "Canada", lat: 45.42, lon: -75.69, country: "Country" }, { name: "Japan", lat: 35.68, lon: 139.69, country: "Country" }, { name: "UK", lat: 51.50, lon: -0.12, country: "Country" }, { name: "France", lat: 48.85, lon: 2.35, country: "Country" }, { name: "Germany", lat: 52.52, lon: 13.40, country: "Country" }, { name: "Turkey", lat: 39.93, lon: 32.85, country: "Country" }, { name: "Mexico", lat: 19.43, lon: -99.13, country: "Country" }, { name: "Argentina", lat: -34.60, lon: -58.38, country: "Country" }, { name: "South Africa", lat: -25.74, lon: 28.18, country: "Country" }, { name: "Saudi Arabia", lat: 24.71, lon: 46.67, country: "Country" }, { name: "Indonesia", lat: -6.20, lon: 106.84, country: "Country" }, { name: "Kazakhstan", lat: 51.16, lon: 71.47, country: "Country" } ];
    const cities = [ { name: "New York", lat: 40.71, lon: -74.00 }, { name: "Los Angeles", lat: 34.05, lon: -118.24 }, { name: "Chicago", lat: 41.87, lon: -87.62 }, { name: "Toronto", lat: 43.65, lon: -79.34 }, { name: "Mexico City", lat: 19.43, lon: -99.13 }, { name: "Sao Paulo", lat: -23.55, lon: -46.63 }, { name: "Rio de Janeiro", lat: -22.90, lon: -43.17 }, { name: "Buenos Aires", lat: -34.60, lon: -58.38 }, { name: "London", lat: 51.50, lon: -0.12 }, { name: "Paris", lat: 48.85, lon: 2.35 }, { name: "Berlin", lat: 52.52, lon: 13.40 }, { name: "Madrid", lat: 40.41, lon: -3.70 }, { name: "Rome", lat: 41.90, lon: 12.49 }, { name: "Istanbul", lat: 41.00, lon: 28.97 }, { name: "Moscow", lat: 55.75, lon: 37.61 }, { name: "Cairo", lat: 30.04, lon: 31.23 }, { name: "Lagos", lat: 6.52, lon: 3.37 }, { name: "Johannesburg", lat: -26.20, lon: 28.04 }, { name: "Dubai", lat: 25.20, lon: 55.27 }, { name: "Mumbai", lat: 19.07, lon: 72.87 }, { name: "Delhi", lat: 28.70, lon: 77.10 }, { name: "Bangkok", lat: 13.75, lon: 100.50 }, { name: "Singapore", lat: 1.35, lon: 103.81 }, { name: "Jakarta", lat: -6.20, lon: 106.84 }, { name: "Beijing", lat: 39.90, lon: 116.40 }, { name: "Shanghai", lat: 31.23, lon: 121.47 }, { name: "Hong Kong", lat: 22.31, lon: 114.16 }, { name: "Seoul", lat: 37.56, lon: 126.97 }, { name: "Tokyo", lat: 35.68, lon: 139.69 }, { name: "Sydney", lat: -33.86, lon: 151.20 }, { name: "Tashkent", lat: 41.29, lon: 69.24 }, { name: "Almaty", lat: 43.22, lon: 76.85 } ];

    const allLocations = [...continents, ...countries, ...cities];
    const weatherArray = await fetchWeatherInBatches(allLocations);
    let index = 0;

    for (const c of continents) {
        const current = weatherArray[index++]?.current;
        if (!current) continue;
        const img = await createMarkerImage(c.name, Math.round(current.temperature_2m), false, false);
        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 10000),
            billboard: { image: img, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, scale: 1.5, distanceDisplayCondition: new Cesium.DistanceDisplayCondition(12000000.0, 30000000.0) }
        });
        allEntitiesMap[`cont-${c.name}`] = { entity, code: current.weather_code, wind: current.wind_speed_10m, temp: current.temperature_2m, feelsLike: current.apparent_temperature, humidity: current.relative_humidity_2m, name: c.name, country: "Continent", lat: c.lat, lon: c.lon, type: 'continent' };
    }

    for (const c of countries) {
        const current = weatherArray[index++]?.current;
        if (!current) continue;
        const img = await createMarkerImage(c.name, Math.round(current.temperature_2m), false, false);
        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 5000),
            billboard: { image: img, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, scale: 1.2, distanceDisplayCondition: new Cesium.DistanceDisplayCondition(4000000.0, 12000000.0) }
        });
        allEntitiesMap[`coun-${c.name}`] = { entity, code: current.weather_code, wind: current.wind_speed_10m, temp: current.temperature_2m, feelsLike: current.apparent_temperature, humidity: current.relative_humidity_2m, name: c.name, country: "Country", lat: c.lat, lon: c.lon, type: 'country' };
    }

    for (const c of cities) {
        const current = weatherArray[index++]?.current;
        if (!current) continue;
        const img = await createMarkerImage(c.name, Math.round(current.temperature_2m), false, false);
        const entity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat),
            billboard: { image: img, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, scale: 1.0, distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, 4000000.0), disableDepthTestDistance: Number.POSITIVE_INFINITY }
        });
        allEntitiesMap[`city-${c.name}`] = { entity, code: current.weather_code, wind: current.wind_speed_10m, temp: current.temperature_2m, feelsLike: current.apparent_temperature, humidity: current.relative_humidity_2m, name: c.name, country: "", lat: c.lat, lon: c.lon, type: 'city' };
    }
}

// === 6. ФИЛЬТРАЦИЯ ===
function applyFilter(filterType) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === filterType) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    for (const key in allEntitiesMap) {
        const data = allEntitiesMap[key];
        let isVisible = false;
        
        if (filterType === 'all') isVisible = true;
        else if (filterType === 'clear') isVisible = [0, 1].includes(data.code);
        else if (filterType === 'clouds') isVisible = [2, 3, 45, 48].includes(data.code);
        else if (filterType === 'rain') isVisible = (data.code >= 51 && data.code <= 65) || data.code === 95;
        else if (filterType === 'snow') isVisible = [71, 73, 75].includes(data.code);
        else if (filterType === 'wind') isVisible = data.wind > 15;

        data.entity.show = isVisible;

        if (isVisible) {
            if (filterType === 'wind') {
                createMarkerImage(data.name, Math.round(data.wind || 0), false, true).then(img => { data.entity.billboard.image = img; });
            } else {
                createMarkerImage(data.name, Math.round(data.temp), false, false).then(img => { data.entity.billboard.image = img; });
            }
        }
    }
}

document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => applyFilter(e.target.dataset.filter));
});

// === 7. ПОИСК ===
async function searchCity() {
    const city = cityInput.value.trim();
    if (!city) return;

    loader.style.display = 'block';
    weatherInfo.style.display = 'none';
    errorMsg.style.display = 'none';
    autoRotate = false;

    try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) throw new Error("City not found");

        const { latitude, longitude, name, country } = geoData.results[0];

        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m`);
        const weatherData = await weatherRes.json();
        const current = weatherData.current;
        
        if (selectedCityEntity) viewer.entities.remove(selectedCityEntity);
        const selectedMarkerImage = await createMarkerImage(name, Math.round(current.temperature_2m), true, false);
        
        const cityKey = Object.keys(allEntitiesMap).find(k => allEntitiesMap[k].name.toLowerCase() === name.toLowerCase());
        if (cityKey) {
            viewer.entities.remove(allEntitiesMap[cityKey].entity);
            delete allEntitiesMap[cityKey];
        }

        selectedCityEntity = viewer.entities.add({
            position: Cesium.Cartesian3.fromDegrees(longitude, latitude),
            billboard: { image: selectedMarkerImage, verticalOrigin: Cesium.VerticalOrigin.BOTTOM, heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, scale: 1.2, disableDepthTestDistance: Number.POSITIVE_INFINITY }
        });

        loader.style.display = 'none';
        handleEntityClick(longitude, latitude, name, country, current.weather_code, current.wind_speed_10m, current.temperature_2m, current.apparent_temperature, current.relative_humidity_2m);

    } catch (error) {
        loader.style.display = 'none';
        errorMsg.style.display = 'block';
        weatherInfo.style.display = 'none';
    }
}

searchBtn.addEventListener('click', searchCity);
cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchCity(); });

resetViewBtn.addEventListener('click', () => {
    if (selectedCityEntity) { viewer.entities.remove(selectedCityEntity); selectedCityEntity = null; }
    document.getElementById('chartContainer').style.display = 'none';
    if (forecastChartInstance) { forecastChartInstance.destroy(); forecastChartInstance = null; }
    
    viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 20, 25000000),
        orientation: { heading: 0.0, pitch: Cesium.Math.toRadians(-90.0), roll: 0.0 },
        duration: 3.0
    });
});

function locateUser() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const lon = position.coords.longitude;
            const lat = position.coords.latitude;
            if (userLocationEntity) viewer.entities.remove(userLocationEntity);
            userLocationEntity = viewer.entities.add({
                position: Cesium.Cartesian3.fromDegrees(lon, lat),
                point: { pixelSize: 12, color: Cesium.Color.RED, outlineColor: Cesium.Color.WHITE, outlineWidth: 2, disableDepthTestDistance: Number.POSITIVE_INFINITY }
            });
        }, (error) => console.warn("Геолокация отклонена.", error));
    }
}

loadHierarchy();
locateUser();