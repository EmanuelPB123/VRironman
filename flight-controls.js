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
    this.hud = document.createElement('div');
    this.hud.id = 'flight-hud';
    document.body.appendChild(this.hud);
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
    
    let hudContent = `
        <div class="hud-center"></div>
        <div class="hud-horizon" style="transform: translate(-50%, -50%) rotate(${this.currentVelocity.z * 1000}deg)"></div>
        <div class="hud-altitude">
            <span class="alt-value">${Math.round(this.el.object3D.position.y)}m</span>
        </div>
        <div class="hud-speed">
            <span class="speed-value">${Math.round(Math.abs(this.currentVelocity.z) * 100)}km/h</span>
        </div>
        <div class="angle-indicator">
            <div class="angle-value">${Math.round(adjustedPitch)}°</div>
            <div class="angle-line" style="transform: rotate(${adjustedPitch}deg)"></div>
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