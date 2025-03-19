const TILT_THRESHOLD = 0;
const EXTREME_TILT_THRESHOLD = 10;
const MOVEMENT_SPEED = 0.1;
const VERTICAL_SPEED = 0.05;
const NEUTRAL_ANGLE = -30;

AFRAME.registerComponent('flight-button', {
  init: function() {
    this.el.addEventListener('click', () => {
      const rig = document.querySelector('#rig');
      const flightControls = rig.components['flight-controls'];
      flightControls.toggleFlightMode();
      
      // Visual feedback
      this.el.setAttribute('material', {
        color: flightControls.flightMode ? '#FFD700' : '#ff4400'
      });
    });
  }
});

AFRAME.registerComponent('flight-controls', {
  init: function() {
    this.flightMode = false;
    this.currentVelocity = new THREE.Vector3();
    
    // Crear el HUD con estilo Iron Man
    this.hud = document.createElement('div');
    this.hud.id = 'flight-hud';
    document.body.appendChild(this.hud);
    
    // Añadir estilos CSS para el HUD de Iron Man
    const style = document.createElement('style');
    style.textContent = `
      #flight-hud {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 9999;
        font-family: 'Courier New', monospace;
        color: #00bfff;
        text-shadow: 0 0 10px rgba(0, 191, 255, 0.7);
        transition: all 0.3s ease;
        opacity: 0.9;
      }
      
      .hud-center {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 80px;
        height: 80px;
        border: 2px solid #00bfff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 20px rgba(0, 191, 255, 0.5), inset 0 0 20px rgba(0, 191, 255, 0.3);
      }
      
      .hud-center::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 10px;
        height: 10px;
        background-color: #00bfff;
        border-radius: 50%;
        transform: translate(-50%, -50%);
        box-shadow: 0 0 10px #00bfff;
      }
      

      
      .hud-altitude {
        position: absolute;
        bottom: 100px;
        right: 50px;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #00bfff;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.5), inset 0 0 10px rgba(0, 191, 255, 0.3);
      }
      
      .hud-speed {
        position: absolute;
        bottom: 100px;
        left: 50px;
        padding: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #00bfff;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.5), inset 0 0 10px rgba(0, 191, 255, 0.3);
      }
      
      .alt-value, .speed-value {
        font-size: 18px;
        font-weight: bold;
      }
      
      .angle-indicator {
        position: absolute;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        text-align: center;
      }
      
      .angle-value {
        font-size: 18px;
        font-weight: bold;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 5px 10px;
        border: 1px solid #00bfff;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
      }
      
      .angle-line {
        margin: 10px auto;
        width: 40px;
        height: 2px;
        background-color: #00bfff;
        box-shadow: 0 0 5px #00bfff;
      }
      
      .hud-systems {
        position: absolute;
        top: 50px;
        right: 50px;
        width: 200px;
        border: 1px solid #00bfff;
        border-radius: 5px;
        background-color: rgba(0, 0, 0, 0.5);
        padding: 10px;
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.5), inset 0 0 10px rgba(0, 191, 255, 0.3);
      }
      
      .system-status {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      }
      
      .hud-arc {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 300px;
        height: 300px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        border: 1px solid rgba(0, 191, 255, 0.3);
        box-shadow: 0 0 20px rgba(0, 191, 255, 0.2);
      }
      
      .hud-arc-inner {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 250px;
        height: 250px;
        transform: translate(-50%, -50%);
        border-radius: 50%;
        border: 1px dashed rgba(0, 191, 255, 0.5);
      }
      
      .heading-marker {
        position: absolute;
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
        width: 120px;
        height: 30px;
        text-align: center;
        font-size: 18px;
        border-bottom: 1px solid #00bfff;
        box-shadow: 0 5px 10px -5px rgba(0, 191, 255, 0.5);
      }
      
      .power-indicator {
        position: absolute;
        bottom: 50px;
        left: 50%;
        transform: translateX(-50%);
        width: 200px;
        height: 10px;
        background-color: rgba(0, 0, 0, 0.5);
        border: 1px solid #00bfff;
        border-radius: 5px;
        overflow: hidden;
        box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);
      }
      
      .power-level {
        height: 100%;
        background-color: #00bfff;
        box-shadow: 0 0 10px #00bfff;
        transition: width 0.3s ease;
      }
    `;
    document.head.appendChild(style);
    
    this.updateHUD();
  },

  updateHUD: function() {
    if (!this.flightMode) {
        this.hud.style.display = 'none';
        return;
    }
    
    this.hud.style.display = 'block';
    const camera = this.el.querySelector('[camera]');
    const pitchDegrees = THREE.MathUtils.radToDeg(camera.object3D.rotation.x);
    // Adjust displayed angle relative to neutral position
    const adjustedPitch = pitchDegrees - NEUTRAL_ANGLE;
    
    // Calculate simulated heading (0-360 degrees)
    const heading = Math.round((camera.object3D.rotation.y * -1) * 180 / Math.PI) % 360;
    const headingDisplay = heading < 0 ? heading + 360 : heading;
    
    // Calculate power level based on velocity (0-100)
    const powerLevel = Math.min(Math.abs(this.currentVelocity.z) * 1000, 100);
    
    // Create random system status for visual effect
    const systemStatus = [
        { name: "PROPULSION", status: "OPTIMAL" },
        { name: "STABILIZERS", status: "ACTIVE" },
        { name: "NAVIGATION", status: Math.random() > 0.8 ? "CALIBRATING" : "ACTIVE" }
    ];
    
    let hudContent = `
        <div class="hud-arc"></div>
        <div class="hud-arc-inner"></div>
        <div class="hud-center"></div>
        <div class="hud-horizon" style="transform: translate(-50%, -50%) rotate(${this.currentVelocity.z * 1000}deg)"></div>
        
        <div class="heading-marker">HDG ${headingDisplay.toString().padStart(3, '0')}°</div>
        
        <div class="hud-altitude">
            <span>ALTITUDE</span><br>
            <span class="alt-value">${Math.round(this.el.object3D.position.y)}m</span>
        </div>
        
        <div class="hud-speed">
            <span>VELOCITY</span><br>
            <span class="speed-value">${Math.round(Math.abs(this.currentVelocity.z) * 100)}km/h</span>
        </div>
        
        <div class="angle-indicator">
            <div class="angle-value">PITCH ${Math.round(adjustedPitch) > 0 ? '+' : ''}${Math.round(adjustedPitch)}°</div>
            <div class="angle-line" style="transform: rotate(${adjustedPitch}deg)"></div>
        </div>
        
        <div class="hud-systems">
            <div style="text-align: center; margin-bottom: 10px; border-bottom: 1px solid #00bfff;">SYSTEMS CHECK</div>
            ${systemStatus.map(sys => `
                <div class="system-status">
                    <span>${sys.name}</span>
                    <span>${sys.status}</span>
                </div>
            `).join('')}
        </div>
        
        <div class="power-indicator">
            <div class="power-level" style="width: ${powerLevel}%"></div>
        </div>
    `;
    
    this.hud.innerHTML = hudContent;
  },

  toggleFlightMode: function() {
    this.flightMode = !this.flightMode;
    this.currentVelocity.set(0, 0, 0);
    this.updateHUD();
  },

  tick: function() {
    if (!this.flightMode) return;

    // Get camera rotation in degrees and adjust for neutral angle
    const camera = this.el.querySelector('[camera]');
    const rotation = camera.object3D.rotation.clone();
    const pitchDegrees = THREE.MathUtils.radToDeg(rotation.x);
    const adjustedPitch = pitchDegrees - NEUTRAL_ANGLE;

    // Reset velocity
    this.currentVelocity.set(0, 0, 0);

    // Forward/Backward movement based on pitch (0-10 degrees)
    if (Math.abs(adjustedPitch) < EXTREME_TILT_THRESHOLD) {
        if (adjustedPitch < -TILT_THRESHOLD) {
            // Looking up - move forward
            const normalizedPitch = Math.abs(adjustedPitch) / EXTREME_TILT_THRESHOLD;
            this.currentVelocity.z = -MOVEMENT_SPEED * normalizedPitch;
        } else if (adjustedPitch > TILT_THRESHOLD) {
            // Looking down - move backward
            const normalizedPitch = Math.abs(adjustedPitch) / EXTREME_TILT_THRESHOLD;
            this.currentVelocity.z = MOVEMENT_SPEED * normalizedPitch;
        }
    }

    // Vertical movement based on extreme pitch
    if (adjustedPitch <= -EXTREME_TILT_THRESHOLD) {
        // Looking extreme up - move down
        this.currentVelocity.y = -VERTICAL_SPEED;
    } else if (adjustedPitch >= EXTREME_TILT_THRESHOLD) {
        // Looking extreme down - move up
        this.currentVelocity.y = VERTICAL_SPEED;
    }

    // Apply movement in the direction the camera is facing
    const cameraDirection = new THREE.Vector3();
    camera.object3D.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // Keep horizontal movement on xz plane
    cameraDirection.normalize();

    const movement = new THREE.Vector3();
    movement.z = this.currentVelocity.z;
    movement.y = this.currentVelocity.y;

    // Apply horizontal movement in camera's facing direction
    if (movement.z !== 0) {
        this.el.object3D.position.add(cameraDirection.multiplyScalar(movement.z));
    }
    // Apply vertical movement directly
    this.el.object3D.position.y += movement.y;

    this.updateHUD();
  }
});
