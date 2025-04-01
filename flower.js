class FlowerAnimation {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById("flower-canvas"),
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    this.petals = [];
    this.flowerGroup = new THREE.Group();
    this.scene.add(this.flowerGroup);

    this.init();
    this.animate();
    this.handleResize();
  }

  init() {
    // Create flower center
    const centerGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const centerMaterial = new THREE.MeshPhongMaterial({
      color: 0xffd700,
      shininess: 100,
    });
    const center = new THREE.Mesh(centerGeometry, centerMaterial);
    this.flowerGroup.add(center);

    // Create petals
    const petalGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 100);
    const petalMaterial = new THREE.MeshPhongMaterial({
      color: 0xff69b4,
      shininess: 50,
    });

    for (let i = 0; i < 12; i++) {
      const petal = new THREE.Mesh(petalGeometry, petalMaterial);
      const angle = (i / 12) * Math.PI * 2;
      const radius = 1;

      petal.position.x = Math.cos(angle) * radius;
      petal.position.y = Math.sin(angle) * radius;
      petal.rotation.z = angle + Math.PI / 2;

      this.petals.push(petal);
      this.flowerGroup.add(petal);
    }

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    this.scene.add(directionalLight);

    // Position camera
    this.camera.position.z = 5;
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Rotate the entire flower
    this.flowerGroup.rotation.y += 0.005;

    // Animate petals
    this.petals.forEach((petal, index) => {
      const time = Date.now() * 0.001;
      const angle = (index / this.petals.length) * Math.PI * 2;

      petal.position.y = Math.sin(time + angle) * 0.1;
      petal.rotation.x = Math.sin(time + angle) * 0.2;
    });

    this.renderer.render(this.scene, this.camera);
  }

  handleResize() {
    window.addEventListener("resize", () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}

// Initialize the flower animation when the page loads
window.addEventListener("load", () => {
  new FlowerAnimation();
});
