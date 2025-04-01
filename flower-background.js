// Flower background animation
class Flower {
  constructor() {
    this.element = document.createElement("div");
    this.element.className = "flower";

    // Random flower type (1-3)
    const flowerType = Math.floor(Math.random() * 3) + 1;

    // Different flower designs
    const flowerDesigns = {
      1: `
          <div class="flower-center"></div>
          <div class="flower-petals">
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
          </div>
      `,
      2: `
          <div class="flower-center"></div>
          <div class="flower-petals">
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
          </div>
      `,
      3: `
          <div class="flower-center"></div>
          <div class="flower-petals">
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
              <div class="petal"></div>
          </div>
      `,
    };

    this.element.innerHTML = flowerDesigns[flowerType];
    document.body.appendChild(this.element);

    // Random position at the top of the screen
    this.element.style.left = Math.random() * 100 + "vw";
    this.element.style.top = "-20px";

    // Reduced random size (between 8px and 15px)
    const size = Math.random() * 7 + 8;
    this.element.style.width = size + "px";
    this.element.style.height = size + "px";

    // Random rotation
    this.element.style.transform = `rotate(${Math.random() * 360}deg)`;

    // Random flower colors
    const colors = [
      { primary: "#FF69B4", secondary: "#FFB6C1" }, // Pink
      { primary: "#87CEEB", secondary: "#B0E0E6" }, // Sky Blue
      { primary: "#98FB98", secondary: "#90EE90" }, // Light Green
      { primary: "#DDA0DD", secondary: "#EE82EE" }, // Plum
      { primary: "#F0E68C", secondary: "#FFD700" }, // Yellow
      { primary: "#E6E6FA", secondary: "#B0C4DE" }, // Lavender
    ];

    const colorScheme = colors[Math.floor(Math.random() * colors.length)];
    this.element.style.setProperty("--flower-primary", colorScheme.primary);
    this.element.style.setProperty("--flower-secondary", colorScheme.secondary);

    this.animate();
  }

  animate() {
    const duration = Math.random() * 4 + 8; // Slower falling (8-12 seconds)
    const repeat = -1;

    // Create a GSAP timeline for smoother animations
    const timeline = gsap.timeline({
      repeat: repeat,
      onComplete: () => {
        // Reset position when flower reaches bottom
        this.element.style.top = "-20px";
        this.element.style.left = Math.random() * 100 + "vw";
        this.element.style.transform = `rotate(${Math.random() * 360}deg)`;
      },
    });

    // Falling animation with improved easing
    timeline.to(this.element, {
      y: "100vh",
      rotation: "+=360",
      duration: duration,
      ease: "none",
      force3D: true,
    });

    // Slight horizontal movement with smoother easing
    timeline.to(
      this.element,
      {
        x: "+=30",
        duration: duration,
        ease: "sine.inOut",
        force3D: true,
      },
      "<"
    ); // Start at the same time as the falling animation

    // Fade in and out effect with improved timing
    timeline.to(
      this.element,
      {
        opacity: 0.7,
        duration: duration / 2,
        yoyo: true,
        repeat: 1,
        ease: "sine.inOut",
        force3D: true,
      },
      "<"
    ); // Start at the same time as the falling animation

    // Add a subtle scale animation
    timeline.to(
      this.element,
      {
        scale: 1.1,
        duration: duration / 4,
        yoyo: true,
        repeat: 3,
        ease: "sine.inOut",
        force3D: true,
      },
      "<"
    ); // Start at the same time as the falling animation
  }
}

// Create multiple flowers
function createFlowerBackground() {
  const flowerCount = 25; // Increased number of flowers
  for (let i = 0; i < flowerCount; i++) {
    new Flower();
  }
}

// Initialize flower background
createFlowerBackground();
