class BackgroundAnimation {
  constructor() {
    this.canvas = document.getElementById("flower-canvas");
    this.ctx = this.canvas.getContext("2d");
    this.patterns = [];
    this.init();
    this.animate();
    this.handleResize();
  }

  init() {
    this.resize();
    this.createPatterns();
  }

  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createPatterns() {
    const size = 60;
    const cols = Math.ceil(this.canvas.width / size);
    const rows = Math.ceil(this.canvas.height / size);

    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        this.patterns.push({
          x: i * size,
          y: j * size,
          size: size,
          rotation: Math.random() * Math.PI * 2,
          scale: 0.8 + Math.random() * 0.4,
          speed: 0.001 + Math.random() * 0.002,
        });
      }
    }
  }

  drawPattern(pattern) {
    this.ctx.save();
    this.ctx.translate(
      pattern.x + pattern.size / 2,
      pattern.y + pattern.size / 2
    );
    this.ctx.rotate(pattern.rotation);
    this.ctx.scale(pattern.scale, pattern.scale);

    // Draw hexagon
    this.ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const x = Math.cos(angle) * pattern.size * 0.4;
      const y = Math.sin(angle) * pattern.size * 0.4;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.closePath();

    // Draw connections
    this.ctx.strokeStyle = "var(--primary-color)";
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.patterns.forEach((pattern) => {
      pattern.rotation += pattern.speed;
      pattern.scale = 0.8 + Math.sin(Date.now() * 0.001) * 0.1;
      this.drawPattern(pattern);
    });

    requestAnimationFrame(() => this.animate());
  }

  handleResize() {
    window.addEventListener("resize", () => {
      this.resize();
      this.patterns = [];
      this.createPatterns();
    });
  }
}

// Initialize the background animation when the page loads
window.addEventListener("load", () => {
  new BackgroundAnimation();
});
