AFRAME.registerComponent('weather-display', {
    init: function() {
      const textEl = this.el.querySelector('[text]');
      
      // Función para obtener la ubicación del usuario
      const getLocation = () => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            textEl.setAttribute('text', 'value', 'Geolocalización no soportada');
            reject('Geolocalización no soportada');
          }
          
          textEl.setAttribute('text', 'value', 'Obteniendo ubicación...');
          
          navigator.geolocation.getCurrentPosition(position => {
            resolve({
              lat: position.coords.latitude,
              lon: position.coords.longitude
            });
          }, () => {
            textEl.setAttribute('text', 'value', 'Acceso a ubicación denegado\nUsando datos de Buenos Aires');
            // Si falla la geolocalización, usar datos de Buenos Aires
            this.getArgentinaWeather("Buenos Aires");
            reject('Acceso a ubicación denegado');
          });
        });
      };
      
      // Función para obtener la ciudad más cercana (simplificada)
      const getNearestCity = async (lat, lon) => {
        // Lista de ciudades principales de Argentina con coordenadas aproximadas
        const cities = [
          {name: "Buenos Aires", lat: -34.6037, lon: -58.3816},
          {name: "Córdoba", lat: -31.4201, lon: -64.1888},
          {name: "Rosario", lat: -32.9442, lon: -60.6505},
          {name: "Mendoza", lat: -32.8908, lon: -68.8272},
          {name: "San Miguel de Tucumán", lat: -26.8083, lon: -65.2176},
          {name: "La Plata", lat: -34.9214, lon: -57.9545},
          {name: "Mar del Plata", lat: -38.0055, lon: -57.5426},
          {name: "Salta", lat: -24.7821, lon: -65.4232},
          {name: "Santa Fe", lat: -31.6333, lon: -60.7},
          {name: "San Juan", lat: -31.5375, lon: -68.5364},
          {name: "Resistencia", lat: -27.4606, lon: -58.9839},
          {name: "Neuquén", lat: -38.9516, lon: -68.0591},
          {name: "Posadas", lat: -27.3661, lon: -55.8961},
          {name: "Bariloche", lat: -41.1335, lon: -71.3105}
        ];
        
        // Calcular distancia entre dos puntos (fórmula haversine simplificada)
        const distance = (lat1, lon1, lat2, lon2) => {
          const R = 6371; // Radio de la Tierra en km
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
                    Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          return R * c;
        };
        
        // Encontrar la ciudad más cercana
        let nearestCity = cities[0];
        let minDistance = distance(lat, lon, cities[0].lat, cities[0].lon);
        
        for (let i = 1; i < cities.length; i++) {
          const dist = distance(lat, lon, cities[i].lat, cities[i].lon);
          if (dist < minDistance) {
            minDistance = dist;
            nearestCity = cities[i];
          }
        }
        
        return nearestCity.name;
      };
      
      // Función para obtener clima de Argentina usando Servicio Meteorológico Nacional
      this.getArgentinaWeather = async (cityName) => {
        try {
          textEl.setAttribute('text', 'value', `Consultando clima para\n${cityName}...`);
          
          // Usar CORS proxy para evitar problemas de CORS
          const proxyUrl = 'https://corsproxy.io/?';
          // Esta URL consulta de forma genérica los datos del SMN (sin filtrar por ciudad)
          const url = `${proxyUrl}https://ws.smn.gob.ar/map_items/weather`;
          
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error('No se pudo obtener datos del SMN');
          }
          
          const data = await response.json();
          
          // Buscar la ciudad en los datos (comparación parcial para ser más flexible)
          const cityData = data.find(item => 
            item.name.toLowerCase().includes(cityName.toLowerCase()) || 
            cityName.toLowerCase().includes(item.name.toLowerCase())
          );
          
          if (!cityData) {
            throw new Error(`No se encontraron datos para ${cityName}`);
          }
          
          // Extraer los datos relevantes
          const temp = cityData.weather.temp;
          const humidity = cityData.weather.humidity;
          const description = cityData.weather.description;
          const pressure = cityData.weather.pressure;
          
          textEl.setAttribute('text', {
            value: `${cityData.name}\nTemperatura: ${temp}°C\nHumedad: ${humidity}%\nPresión: ${pressure} hPa\nCondición: ${description}`,
            color: 'cyan',
            align: 'center',
            width: 2
          });
        } catch (error) {
          console.error('Error al obtener datos de Argentina:', error);
          
          // Si falla, mostrar datos simulados
          const now = new Date();
          const hour = now.getHours();
          const baseTemp = 22; // temperatura base en °C para Argentina
          const variation = 8; // variación en °C
          const simTemp = baseTemp + variation * Math.sin((hour - 6) * Math.PI / 12);
          
          // Condiciones basadas en la hora
          let condition;
          if (hour >= 6 && hour < 10) condition = "Mañana despejada";
          else if (hour >= 10 && hour < 16) condition = "Soleado";
          else if (hour >= 16 && hour < 20) condition = "Atardecer";
          else condition = "Noche despejada";
          
          textEl.setAttribute('text', {
            value: `Ubicación: ${cityName}\nTemperatura aproximada: ${simTemp.toFixed(1)}°C\nCondición: ${condition}\n(Datos estimados)`,
            color: 'cyan',
            align: 'center',
            width: 2
          });
        }
      };
      
      // Iniciar el proceso de mostrar el clima
      this.updateWeather = async () => {
        try {
          const location = await getLocation();
          const nearestCity = await getNearestCity(location.lat, location.lon);
          await this.getArgentinaWeather(nearestCity);
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