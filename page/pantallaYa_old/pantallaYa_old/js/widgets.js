/**
 * Widgets Globales (Reloj, Fecha y Clima en Tiempo Real)
 * Este archivo se reutiliza tanto en el dashboard (digital) como en el reproductor a pantalla completa (tablet).
 */

_(document).on("DOMContentLoaded", () => {
  // --- Lógica del Reloj y Fecha ---
  function updateClock() {
    const now = new Date();

    // Hora
    let hours = now.getHours();
    let minutes = now.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    minutes = minutes < 10 ? "0" + minutes : minutes;

    _("#clock, .time-widget").text(hours + ":" + minutes + " " + ampm);

    // Fecha
    const options = { weekday: "long", month: "short", day: "numeric" };
    let dateStr = now.toLocaleDateString("es-ES", options);

    _("#date, .date-widget").text(
      dateStr.charAt(0).toUpperCase() + dateStr.slice(1),
    );
  }

  // Iniciar reloj
  setInterval(updateClock, 1000);
  updateClock();

  // --- Lógica del Clima (Real-Time API) ---
  async function updateWeather() {
    const weatherEls = _(".weather-widget");
    if (!weatherEls || weatherEls.length === 0) return;

    try {
      // 1. Obtener ubicación aproximada por IP (gratis, sin API key)
      const geoRes = await fetch("https://get.geojs.io/v1/ip/geo.json");
      if (!geoRes.ok) return;
      const geoData = await geoRes.json();
      const lat = geoData.latitude;
      const lon = geoData.longitude;

      // 2. Consultar el clima actual en base a las coordenadas (Open-Meteo)
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`,
      );
      if (!weatherRes.ok) return;
      const weatherData = await weatherRes.json();

      if (weatherData && weatherData.current_weather) {
        const temp = Math.round(weatherData.current_weather.temperature);
        const code = weatherData.current_weather.weathercode;

        // 3. Mapear el código meteorológico WMO a un Emoji atractivo
        let icon = "🌤️"; // Default
        if (code === 0)
          icon = "☀️"; // Despejado
        else if (code >= 1 && code <= 3)
          icon = "⛅"; // Parcialmente nublado
        else if (code >= 45 && code <= 48)
          icon = "🌫️"; // Niebla
        else if (code >= 51 && code <= 67)
          icon = "🌧️"; // Lluvia/Llovizna
        else if (code >= 71 && code <= 77)
          icon = "❄️"; // Nieve
        else if (code >= 80 && code <= 82)
          icon = "🌦️"; // Chubascos
        else if (code >= 95 && code <= 99) icon = "⛈️"; // Tormenta

        // Actualizar todos los elementos en el DOM con Lexx JS
        weatherEls.css("opacity", "0");
        setTimeout(() => {
          weatherEls.html(`<span>${icon}</span> ${temp}°C`);
          weatherEls.css("transition", "opacity 0.5s ease");
          weatherEls.css("opacity", "1");
        }, 300);
      }
    } catch (e) {
      console.log("Aviso: No se pudo cargar el clima en vivo.", e);
    }
  }

  // Ejecutar clima al instante y actualizar cada 30 minutos
  updateWeather();
  setInterval(updateWeather, 30 * 60 * 1000);
});
