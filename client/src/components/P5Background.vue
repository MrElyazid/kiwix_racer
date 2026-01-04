<template>
  <div ref="canvasContainer" class="p5-background"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import p5 from "p5";

const canvasContainer = ref(null);
let sketch = null;

const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

onMounted(() => {
  const particles = [];

  const sketchFunction = (p) => {
    class Particle {
      constructor() {
        this.x = p.random(p.windowWidth);
        this.y = p.random(p.windowHeight);
        this.vx = p.random(-0.5, 0.5);
        this.vy = p.random(-0.5, 0.5);
        this.letter = letters[p.floor(p.random(letters.length))];
        this.size = p.random(20, 40);
        this.rotation = p.random(p.TWO_PI);
        this.rotationSpeed = p.random(-0.01, 0.01);
        this.colorIndex = p.floor(p.random(3));
        this.timeOffset = p.random(1000);
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.rotation += this.rotationSpeed;

        if (this.x < -50) this.x = p.windowWidth + 50;
        if (this.x > p.windowWidth + 50) this.x = -50;
        if (this.y < -50) this.y = p.windowHeight + 50;
        if (this.y > p.windowHeight + 50) this.y = -50;
      }

      display() {
        const colors = [
          [255, 143, 143],
          [194, 226, 250],
          [183, 163, 227]
        ];

        const baseColor = colors[this.colorIndex];
        // on calcule le wave avec un coef plus simple
        const wave = Math.sin((p.frameCount + this.timeOffset) * 0.02) * 0.5 + 0.5;
        const opacity = 60 + wave * 60; // map simplifié

        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        p.fill(baseColor[0], baseColor[1], baseColor[2], opacity);
        p.textSize(this.size);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(this.letter, 0, 0);
        p.pop();
      }
    }

    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent(canvasContainer.value);
      p.pixelDensity(1); // moins de pixels à calculer sur écrans retina

      for (let i = 0; i < 70; i++) { // légèrement moins de particules
        particles.push(new Particle());
      }
    };

    p.draw = () => {
      p.clear(); // on garde clear pour l’effet fluide

      for (const particle of particles) {
        particle.update();
        particle.display();
      }
    };

    p.windowResized = () => {
      p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
  };

  sketch = new p5(sketchFunction);
});

onUnmounted(() => {
  if (sketch) sketch.remove();
});
</script>

<style scoped>
.p5-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: -1;
  background: #FFF1CB;
}
</style>
