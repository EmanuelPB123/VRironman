// Add look-at-camera component
AFRAME.registerComponent('look-at-camera', {
  tick: function() {
    const cameraEl = document.querySelector('a-camera');
    if (cameraEl) {
      const worldPos = new THREE.Vector3();
      cameraEl.object3D.getWorldPosition(worldPos);
      this.el.object3D.lookAt(worldPos);
    }
  }
});

// Updated clickable component
AFRAME.registerComponent('clickable', {
  init: function() {
    const iframe = document.querySelector('#radio-frame');
    const screen = document.querySelector('#virtual-screen');
    const closeButton = document.querySelector('#close-button');
    const errorMessage = document.querySelector('#error-message');
    
    const handleClick = () => {
      if (iframe.style.display === 'none' || !iframe.style.display) {
        // Show immediately
        iframe.style.display = 'block';
        closeButton.style.display = 'block';
        screen.setAttribute('visible', true);
        
        // Simple error check
        iframe.onerror = () => {
          iframe.style.display = 'none';
          errorMessage.style.display = 'block';
        };
      } else {
        iframe.style.display = 'none';
        closeButton.style.display = 'none';
        errorMessage.style.display = 'none';
        screen.setAttribute('visible', false);
      }
    };

    this.el.addEventListener('click', handleClick);
    this.el.addEventListener('mouseenter', () => {
      console.log('Mouse enter detected');
    });

    closeButton.addEventListener('click', () => {
      iframe.style.display = 'none';
      closeButton.style.display = 'none';
      errorMessage.style.display = 'none';
      screen.setAttribute('visible', false);
    });
  }
});