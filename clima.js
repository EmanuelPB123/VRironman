    AFRAME.registerComponent('weather-display', {
      init: function() {
        const textEl = this.el.querySelector('[text]');
        
        // Función específica para obtener clima de Comodoro Rivadavia
        this.getComodoroWeather = async () => {
          try {
            textEl.setAttribute('text', 'value', 'Consultando clima para\nComodoro Rivadavia...');
            
            // Usar CORS proxy para evitar problemas de CORS
            const proxyUrl = 'https://corsproxy.io/?';
            const url = `${proxyUrl}https://ws.smn.gob.ar/map_items/weather`;
            
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error('No se pudo obtener datos del SMN');
            }
            
            const data = await response.json();
            
            // Buscar Comodoro Rivadavia en los datos
            const cityData = data.find(item => 
              item.name.toLowerCase().includes('comodoro') || 
              item.name.toLowerCase().includes('rivadavia')
            );
            
            if (!cityData) {
              throw new Error('No se encontraron datos para Comodoro Rivadavia');
            }
            
            // Extraer los datos relevantes
            const temp = cityData.weather.temp;
            const humidity = cityData.weather.humidity;
            const description = cityData.weather.description;
            const visibility = cityData.weather.visibility;
            const pressure = cityData.weather.pressure;
            const wind_speed = cityData.weather.wind_speed;
            const wind_direction = cityData.weather.wind_direction;
            
            textEl.setAttribute('text', {
              value: `Comodoro Rivadavia\nTemperatura: ${temp}°C\nHumedad: ${humidity}%\nViento: ${wind_speed} km/h (${wind_direction})\nPresión: ${pressure} hPa\nVisibilidad: ${visibility} km\nCondición: ${description}`,
              color: 'cyan',
              align: 'center',
              width: 2
            });
          } catch (error) {
            console.error('Error al obtener datos de Comodoro:', error);
            
            // Si falla, mostrar datos simulados específicos para Comodoro
            const now = new Date();
            const hour = now.getHours();
            
            // Comodoro suele ser más fresco que el promedio de Argentina
            const baseTemp = 16; // temperatura base en °C para Comodoro
            const variation = 7; // variación en °C
            const simTemp = baseTemp + variation * Math.sin((hour - 6) * Math.PI / 12);
            
            // Comodoro es conocido por sus vientos fuertes
            const windSpeed = 15 + Math.random() * 30;
            
            // Condiciones basadas en la hora, pero teniendo en cuenta el clima más ventoso de Comodoro
            let condition;
            if (hour >= 6 && hour < 10) condition = "Mañana ventosa";
            else if (hour >= 10 && hour < 16) condition = "Parcialmente nublado";
            else if (hour >= 16 && hour < 20) condition = "Ventoso";
            else condition = "Noche despejada con viento";
            
            textEl.setAttribute('text', {
              value: `Comodoro Rivadavia\nTemperatura estimada: ${simTemp.toFixed(1)}°C\nViento: ${windSpeed.toFixed(1)} km/h\nCondición: ${condition}\n(Datos estimados - Sin conexión)`,
              color: 'cyan',
              align: 'center',
              width: 2
            });
          }
        };
        
        // Iniciar el proceso de mostrar el clima
        this.updateWeather = async () => {
          try {
            await this.getComodoroWeather();
          } catch (error) {
            console.error('Actualización del clima fallida:', error);
          }
        };
        
        // Actualizar clima al inicio y cada 30 minutos
        this.updateWeather();
        this.weatherInterval = setInterval(this.updateWeather, 30 * 60 * 1000);
      },
      
      remove: function() {
        // Limpiar intervalo cuando se elimina el componente
        if (this.weatherInterval) {
          clearInterval(this.weatherInterval);
        }
      }
    });
