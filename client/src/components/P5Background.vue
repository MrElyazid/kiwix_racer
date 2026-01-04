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
  const sketchFunction = (p) => {
    // Simplement plus opaque que l'original
    const colors = [
      [255, 100, 100, 180],    // Rouge plus vif
      [100, 180, 255, 180],    // Bleu plus vif
      [180, 140, 255, 180],    // Violet plus vif
      [255, 180, 100, 180],    // Orange
      [100, 220, 180, 180]     // Turquoise plus vif
    ];
    
    class Particle {
      constructor() {
        this.x = p.random(p.windowWidth);
        this.y = p.random(p.windowHeight);
        this.vx = p.random(-0.2, 0.2);
        this.vy = p.random(-0.2, 0.2);
        this.letter = letters[p.floor(p.random(letters.length))];
        this.size = p.random(18, 25); // Légèrement plus grand
        this.color = colors[p.floor(p.random(colors.length))];
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -50) this.x = p.windowWidth + 50;
        if (this.x > p.windowWidth + 50) this.x = -50;
        if (this.y < -50) this.y = p.windowHeight + 50;
        if (this.y > p.windowHeight + 50) this.y = -50;
      }

      display() {
        p.fill(this.color);
        p.noStroke();
        p.textSize(this.size);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(this.letter, this.x, this.y);
      }
    }

    let particles = [];
    let lastFrameTime = 0;
    const FRAME_INTERVAL = 33;
    
    p.setup = () => {
      const canvas = p.createCanvas(p.windowWidth, p.windowHeight);
      canvas.parent(canvasContainer.value);
      
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push(new Particle());
      }
      
      p.noLoop();
      
      const animate = () => {
        const now = Date.now();
        if (now - lastFrameTime >= FRAME_INTERVAL) {
          lastFrameTime = now;
          p.redraw();
        }
        requestAnimationFrame(animate);
      };
      animate();
    };

    p.draw = () => {
      p.clear();
      
      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].display();
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