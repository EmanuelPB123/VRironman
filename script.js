    // Add new component before the existing ones
    AFRAME.registerComponent('look-at-camera', {
      init: function () {
        this.isLookingAt = false;
        const rotation = this.el.getAttribute('rotation');
        // Store original rotation values individually
        this.originalRotation = {
          x: rotation.x || 0,
          y: rotation.y || 0,
          z: rotation.z || 0
        };

        this.el.addEventListener('mouseenter', () => {
          this.isLookingAt = true;
        });

        this.el.addEventListener('mouseleave', () => {
          this.isLookingAt = false;
          // Return to original rotation smoothly
          this.el.setAttribute('animation', {
            property: 'rotation',
            to: `${this.originalRotation.x} ${this.originalRotation.y} ${this.originalRotation.z}`,
            dur: 0,
            easing: 'easeOutQuad'
          });
        });
      },
      tick: function () {
        if (this.isLookingAt) {
          const camera = document.querySelector('[camera]');
          this.el.object3D.lookAt(camera.object3D.position);
        }
      }
    });

    AFRAME.registerComponent('fps-counter', {
      schema: {
        interval: { type: 'number', default: 1000 }
      },
      init: function () {
        this.fps = 0;
        this.frames = 0;
        this.lastTime = performance.now();

        this.el.setAttribute('text', {
          value: 'FPS: 0',
          color: '#0ff',
          align: 'center',
          width: 2,
          wrapCount: 20
        });
      },
      tick: function () {
        const now = performance.now();
        this.frames++;

        if (now - this.lastTime > this.data.interval) {
          this.fps = Math.round((this.frames * 1000) / (now - this.lastTime));
          this.el.setAttribute('text', { value: `FPS: ${this.fps}` });
          this.lastTime = now;
          this.frames = 0;
        }
      }
    });

    AFRAME.registerComponent('system-stats', {
      init: function () {
        this.el.setAttribute('text', {
          value: 'System Stats: Loading...',
          color: '#0ff',
          align: 'center',
          width: 2,
          wrapCount: 20
        });
        this.updateStats();
      },
      updateStats: function () {
        let statsText = 'System Stats:\n';

        if (window.performance && window.performance.memory) {
          const mem = Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
          statsText += `Memory: ${mem}MB\n`;
        } else {
          statsText += 'Memory: N/A\n';
        }

        this.el.setAttribute('text', { value: statsText });
        setTimeout(() => this.updateStats(), 1000);
      }
    });

    AFRAME.registerComponent('date-time', {
      init: function () {
        this.el.setAttribute('text', {
          value: 'Loading time...',
          color: '#0ff',
          align: 'center',
          width: 2,
          wrapCount: 20
        });
        this.updateDateTime();
      },
      updateDateTime: function () {
        const now = new Date();
        const text = `${now.toLocaleDateString()}\n${now.toLocaleTimeString()}`;
        this.el.setAttribute('text', { value: text });
        setTimeout(() => this.updateDateTime(), 1000);
      }
    });

    // Funciones para manejar las ventanas emergentes
    function openOverlay(overlayId) {
      document.getElementById(overlayId).style.display = 'block';
    }

    function closeOverlay(overlayId) {
      document.getElementById(overlayId).style.display = 'none';
    }

    // Hacer que los elementos con clase 'clickable' sean interactivos
    AFRAME.registerComponent('clickable', {
      init: function () {
        let el = this.el;

        el.addEventListener('mouseenter', function () {
          el.setAttribute('scale', '1.1 1.1 1.1');
        });

        el.addEventListener('mouseleave', function () {
          el.setAttribute('scale', '1 1 1');
        });

        el.addEventListener('click', function () {
          let overlayId = el.getAttribute('data-overlay');
          if (overlayId) {
            openOverlay(overlayId);
          }
        });
      }
    });

    // Verificar que todo esté cargado antes de inicializar
    document.addEventListener('DOMContentLoaded', function () {
      // Añadir componente clickable a todos los elementos necesarios
      document.querySelectorAll('.clickable').forEach(el => {
        if (!el.hasAttribute('clickable')) {
          el.setAttribute('clickable', '');
        }
      });
    });
