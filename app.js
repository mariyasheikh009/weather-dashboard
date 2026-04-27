// DOM Elements
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

// State
const state = {
  location: { name: "Indor", lat: 22.72, lon: 75.85 },
  weather: null,
  selectedDay: 0,
  activeMetric: "temp",
  feelsLike: false
};

// Weather codes to descriptions
const weatherDescriptions = {
  0: "Sunny",
  1: "Mainly Clear",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Foggy",
  48: "Foggy",
  51: "Drizzle",
  53: "Drizzle",
  55: "Drizzle",
  61: "Rainy",
  63: "Rainy",
  65: "Heavy Rain",
  71: "Snowy",
  73: "Snowy",
  75: "Heavy Snow",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Rain Showers",
  95: "Thunderstorm",
  96: "Thunderstorm",
  99: "Thunderstorm"
};

// Weather icons mapping
const weatherIcons = {
  0: "☀️",
  1: "🌤️",
  2: "⛅",
  3: "☁️",
  45: "🌫️",
  48: "🌫️",
  51: "🌦️",
  53: "🌦️",
  55: "🌦️",
  61: "🌧️",
  63: "🌧️",
  65: "🌧️",
  71: "❄️",
  73: "❄️",
  75: "❄️",
  80: "🌧️",
  81: "🌧️",
  82: "🌧️",
  95: "⛈️",
  96: "⛈️",
  99: "⛈️"
};

// Wind direction converter
function getWindDirection(deg) {
  if (deg === null || deg === undefined) return "--";
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(deg / 45) % 8;
  return directions[index];
}

// AQI description
function getAQIDescription(aqi) {
  if (aqi === null || aqi === undefined) return "--";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return "Today";
  } else if (date.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
}

// Fetch weather data
async function fetchWeather(lat, lon) {
  try {
    updateStatus("Loading...", "warning");
    
    const currentParams = [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "weather_code",
      "wind_speed_10m",
      "wind_direction_10m",
      "pressure_msl",
      "is_day"
    ].join(",");
    
    const hourlyParams = [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "weather_code",
      "wind_speed_10m",
      "visibility",
      "pressure_msl"
    ].join(",");
    
    const dailyParams = [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_probability_max"
    ].join(",");
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto&forecast_days=7&past_days=1`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    state.weather = data;
    updateWeatherUI();
    updateStatus("Live", "success");
    
  } catch (error) {
    console.error("Error fetching weather:", error);
    updateStatus("Error", "error");
  }
}

// Update status indicator
function updateStatus(text, type) {
  const statusText = $(".status-text");
  const statusDot = $(".status-dot");
  
  statusText.textContent = text;
  
  // Remove all classes
  statusDot.classList.remove("success", "error", "warning");
  
  // Add appropriate class
  switch(type) {
    case "success":
      statusDot.classList.add("success");
      break;
    case "error":
      statusDot.classList.add("error");
      break;
    case "warning":
      statusDot.classList.add("warning");
      break;
  }
}

// Update weather UI
function updateWeatherUI() {
  if (!state.weather) return;
  
  const current = state.weather.current;
  const daily = state.weather.daily;
  const hourly = state.weather.hourly;
  
  // Update header
  $("#locationNameHeader").textContent = state.location.name;
  $("#currentTempHeader").textContent = Math.round(current.temperature_2m) + "°";
  
  // Update location info
  $("#locationName").textContent = state.location.name;
  $(".location-subtext").textContent = "Live data from Open-Meteo";
  
  // Update current weather
  $("#currentTemp").textContent = Math.round(current.temperature_2m);
  $("#feelsLike").textContent = Math.round(current.apparent_temperature);
  
  const weatherCode = current.weather_code;
  $("#conditionText").textContent = weatherDescriptions[weatherCode] || "Clear";
  $("#weatherIcon").textContent = weatherIcons[weatherCode] || "☀️";
  
  // Update last updated
  const now = new Date();
  $("#lastUpdated").textContent = `Last updated: ${now.toLocaleTimeString()}`;
  
  // Update summary
  const todayMax = daily.temperature_2m_max[1]; // Tomorrow is index 1 due to past_days=1
  const todayMin = daily.temperature_2m_min[1];
  $("#weatherSummary").textContent = 
    `Expect ${weatherDescriptions[weatherCode].toLowerCase()} conditions. ` +
    `The high will be ${Math.round(todayMax)}° and low will be ${Math.round(todayMin)}°.`;
  
  // Update stats
  $("#windSpeed").textContent = `${Math.round(current.wind_speed_10m)} km/h`;
  $("#windDirection").textContent = getWindDirection(current.wind_direction_10m);
  $("#humidity").textContent = `${current.relative_humidity_2m}%`;
  $("#pressure").textContent = `${Math.round(current.pressure_msl)} mb`;
  
  // Simulate AQI (Open-Meteo free API doesn't provide this)
  const simulatedAQI = Math.floor(Math.random() * 100) + 50;
  $("#airQuality").textContent = simulatedAQI;
  $("#airQualityText").textContent = getAQIDescription(simulatedAQI);
  
  // Simulate visibility
  const simulatedVisibility = (Math.random() * 5 + 5).toFixed(1);
  $("#visibility").textContent = `${simulatedVisibility} km`;
  
  // Simulate dew point
  const dewPoint = current.temperature_2m - ((100 - current.relative_humidity_2m) / 5);
  $("#dewPoint").textContent = `${Math.round(dewPoint)}°`;
  
  // Update map
  const mapFrame = $("#mapFrame");
  const bbox = `${state.location.lon - 0.1},${state.location.lat - 0.1},${state.location.lon + 0.1},${state.location.lat + 0.1}`;
  mapFrame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${state.location.lat},${state.location.lon}`;
  
  $("#mapCaption").textContent = `${state.location.name} Area Map`;
  $("#mapLink").href = `https://www.openstreetmap.org/?mlat=${state.location.lat}&mlon=${state.location.lon}#map=12/${state.location.lat}/${state.location.lon}`;
  
  // Update day cards
  updateDayCards();
  
  // Update hourly timeline
  updateHourlyTimeline();
}

// Update day cards
function updateDayCards() {
  const dayCardsContainer = $("#dayCards");
  dayCardsContainer.innerHTML = "";
  
  const daily = state.weather.daily;
  
  daily.time.forEach((date, index) => {
    // Skip today (index 0) as it's in the past due to past_days=1
    if (index === 0) return;
    
    const card = document.createElement("div");
    card.className = `day-card ${index === state.selectedDay ? 'selected' : ''}`;
    
    const dayName = formatDate(date);
    const dayNumber = new Date(date).getDate();
    const weatherCode = daily.weather_code[index];
    const maxTemp = Math.round(daily.temperature_2m_max[index]);
    const minTemp = Math.round(daily.temperature_2m_min[index]);
    const precip = daily.precipitation_probability_max[index] || 0;
    
    card.innerHTML = `
      <div class="day-name">${dayName}</div>
      <div class="day-number">${dayNumber}</div>
      <div class="day-icon">${weatherIcons[weatherCode] || "☀️"}</div>
      <div class="day-temps">${maxTemp}° / ${minTemp}°</div>
      <div class="day-precip">${precip}% rain</div>
    `;
    
    card.addEventListener("click", () => {
      state.selectedDay = index;
      $$('.day-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      updateHourlyTimeline();
    });
    
    dayCardsContainer.appendChild(card);
  });
}

// Update hourly timeline
function updateHourlyTimeline() {
  const timelineContainer = $("#hourlyTimeline");
  timelineContainer.innerHTML = "";
  
  const hourly = state.weather.hourly;
  const selectedDate = state.weather.daily.time[state.selectedDay];
  
  // Filter hourly data for selected date
  const hourlyData = hourly.time.map((time, index) => ({
    time,
    temp: hourly.temperature_2m[index],
    feelsLike: hourly.apparent_temperature[index],
    weatherCode: hourly.weather_code[index],
    humidity: hourly.relative_humidity_2m[index],
    wind: hourly.wind_speed_10m[index]
  })).filter(item => item.time.startsWith(selectedDate));
  
  // Show only 12 hours
  const displayData = hourlyData.slice(0, 12);
  
  displayData.forEach(hour => {
    const hourItem = document.createElement("div");
    hourItem.className = "hour-item";
    
    const time = formatTime(hour.time);
    const tempValue = state.feelsLike ? hour.feelsLike : hour.temp;
    const weatherIcon = weatherIcons[hour.weatherCode] || "☀️";
    
    let valueText = "";
    let subtext = "";
    
    switch(state.activeMetric) {
      case "temp":
        valueText = `${Math.round(tempValue)}°`;
        subtext = weatherDescriptions[hour.weatherCode] || "Clear";
        break;
      case "precip":
        valueText = `${Math.round(Math.random() * 50)}%`;
        subtext = "Chance of rain";
        break;
      case "wind":
        valueText = `${Math.round(hour.wind)} km/h`;
        subtext = "Wind speed";
        break;
      case "air":
        valueText = `${Math.floor(Math.random() * 100) + 50}`;
        subtext = getAQIDescription(Math.floor(Math.random() * 100) + 50);
        break;
      case "humidity":
        valueText = `${hour.humidity}%`;
        subtext = "Humidity";
        break;
      case "cloud":
        valueText = `${Math.floor(Math.random() * 100)}%`;
        subtext = "Cloud cover";
        break;
    }
    
    hourItem.innerHTML = `
      <div class="hour-time">${time}</div>
      <div class="hour-icon">${weatherIcon}</div>
      <div class="hour-temp">${valueText}</div>
      <div class="hour-subtext">${subtext}</div>
    `;
    
    timelineContainer.appendChild(hourItem);
  });
}

// Search location
async function searchLocation(query) {
  try {
    updateStatus("Searching...", "warning");
    
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=1`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      state.location = {
        name: result.name,
        lat: result.latitude,
        lon: result.longitude
      };
      
      await fetchWeather(state.location.lat, state.location.lon);
      return true;
    } else {
      updateStatus("Location not found", "error");
      return false;
    }
  } catch (error) {
    console.error("Error searching location:", error);
    updateStatus("Search failed", "error");
    return false;
  }
}

// Initialize
function init() {
  // Load default location
  fetchWeather(state.location.lat, state.location.lon);
  
  // Search form
  $("#searchForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const query = $("#searchInput").value.trim();
    if (query) {
      searchLocation(query);
    }
  });
  
  // Refresh button
  $("#refreshBtn").addEventListener("click", () => {
    const btn = $("#refreshBtn");
    btn.style.transform = "rotate(360deg)";
    setTimeout(() => {
      btn.style.transform = "rotate(0deg)";
      fetchWeather(state.location.lat, state.location.lon);
    }, 300);
  });
  
  // Report button
  $("#reportBtn").addEventListener("click", () => {
    const btn = $("#reportBtn");
    btn.innerHTML = `
      <span class="report-icon">✅</span>
      <span>Thanks for reporting!</span>
    `;
    btn.style.background = "rgba(74, 222, 128, 0.2)";
    setTimeout(() => {
      btn.innerHTML = `
        <span class="report-icon">💬</span>
        <span>Seeing different weather?</span>
      `;
      btn.style.background = "rgba(255, 255, 255, 0.1)";
    }, 2000);
  });
  
  // Toggle switch for feels like
  $("#feelsToggle").addEventListener("change", (e) => {
    state.feelsLike = e.target.checked;
    updateHourlyTimeline();
  });
  
  // Metric tabs
  $$('.metric-tab').forEach(tab => {
    tab.addEventListener("click", () => {
      $$('.metric-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      state.activeMetric = tab.dataset.metric;
      updateHourlyTimeline();
      
      // Update chart title
      const metricNames = {
        temp: "Overview",
        precip: "Precipitation",
        wind: "Wind",
        air: "Air Quality",
        humidity: "Humidity",
        cloud: "Cloud Cover"
      };
      $("#chartTitle").textContent = `${metricNames[state.activeMetric]} - ${state.weather.daily.time[state.selectedDay]}`;
    });
  });
  
  // Navigation items (desktop)
  $$('.nav-item').forEach(item => {
    item.addEventListener("click", () => {
      $$('.nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  // Mobile navigation
  $$('.mobile-nav-item').forEach(item => {
    item.addEventListener("click", () => {
      $$('.mobile-nav-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });
  
  // Map tools
  $$('.map-tool').forEach(tool => {
    tool.addEventListener("click", () => {
      $$('.map-tool').forEach(t => t.classList.remove('selected'));
      tool.classList.add('selected');
    });
  });
}

// Start app
document.addEventListener("DOMContentLoaded", init);