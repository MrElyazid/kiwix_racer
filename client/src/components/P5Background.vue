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
        p.push();
        p.translate(this.x, this.y);
        p.rotate(this.rotation);
        
        const colors = [
          [255, 143, 143],
          [194, 226, 250],
          [183, 163, 227]
        ];
        
        const baseColor = colors[this.colorIndex];
        const wave = p.sin((p.frameCount + this.timeOffset) * 0.02) * 0.5 + 0.5;
        const opacity = p.map(wave, 0, 1, 60, 120);
        
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

      for (let i = 0; i < 100; i++) {
        particles.push(new Particle());
      }
    };

    p.draw = () => {
      p.clear();

      for (let particle of particles) {
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
  if (sketch) {
    sketch.remove();
  }
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
