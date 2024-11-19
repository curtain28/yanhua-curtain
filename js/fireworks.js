const canvas = document.getElementById('fireworks');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const config = {
    particleCount: 1000,
    launchInterval: 500,
    risingSpeed: 10,
    fadeSpeed: 6,
    maxFireworks: 10,
    soundEnabled: true,
    volume: 0.5,
    gravity: 0.05,
    colorfulEnabled: false,
    gradientEnabled: true,
    monochromeEnabled: false,
    heartEffectEnabled: true
};

const explosionSound = document.getElementById('explosion-sound');
const startPrompt = document.getElementById('start-prompt');

class Particle {
    constructor(x, y, color, angle, speed, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = angle;
        this.speed = speed;
        this.life = life;
        this.opacity = 1;
        this.history = [];
    }

    update() {
        this.history.push({ x: this.x, y: this.y });
        if (this.history.length > 10) this.history.shift();

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + config.gravity;
        this.speed *= 0.98;
        this.life -= config.fadeSpeed / 100;
        this.opacity = Math.max(0, this.life / 2);
    }

    draw() {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;

        if (this.life < 1 && config.heartEffectEnabled) {
            this.drawHeart();
        } else {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
            ctx.fill();

            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            for (let i = this.history.length - 1; i >= 0; i--) {
                const point = this.history[i];
                ctx.lineTo(point.x, point.y);
            }
            ctx.strokeStyle = this.color;
            ctx.stroke();
        }
    }

    drawHeart() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.scale(0.1, 0.1);
        ctx.beginPath();
        ctx.moveTo(0, -50);
        ctx.bezierCurveTo(-25, -80, -50, -50, 0, 0);
        ctx.bezierCurveTo(50, -50, 25, -80, 0, -50);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

function randomGradientColor() {
    const startColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    const endColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    return { startColor, endColor };
}

class Firework {
    constructor(x, y, color, isColorful = false, isGradient = false, isMonochrome = false) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.isColorful = isColorful;
        this.isGradient = isGradient;
        this.isMonochrome = isMonochrome;
        this.particles = [];
        this.init();
    }

    init() {
        const gradientColors = this.isGradient ? randomGradientColor() : null;
        for (let i = 0; i < config.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            const life = Math.random() * 3 + 2;
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;
            let particleColor;

            if (this.isMonochrome && config.monochromeEnabled) {
                particleColor = this.color;
            } else if (this.isGradient && config.gradientEnabled) {
                const t = i / config.particleCount;
                particleColor = `hsl(${(1 - t) * parseInt(gradientColors.startColor.match(/\d+/)[0]) + t * parseInt(gradientColors.endColor.match(/\d+/)[0])}, 100%, 50%)`;
            } else if (this.isColorful && config.colorfulEnabled) {
                particleColor = randomColor();
            } else {
                particleColor = `hsl(${Math.random() * 360}, 50%, 50%)`;
            }

            this.particles.push(new Particle(this.x + offsetX, this.y + offsetY, particleColor, angle, speed, life));
        }
    }

    update() {
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });
    }

    draw() {
        this.particles.forEach(particle => particle.draw());
    }
}

class RisingFirework {
    constructor(x, y, targetY, isColorful = false, isGradient = false, isMonochrome = false) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.speed = config.risingSpeed;
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.trail = [];
        this.soundPlayed = false;
        this.isColorful = isColorful;
        this.isGradient = isGradient;
        this.isMonochrome = isMonochrome;
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 3) this.trail.shift();

        this.y -= this.speed;

        if (!this.soundPlayed && this.y - this.targetY <= this.speed * 25) {
            if (config.soundEnabled) {
                const sound = explosionSound.cloneNode();
                sound.volume = config.volume;
                sound.play().catch(e => console.log('音频播放失败:', e));
            }
            this.soundPlayed = true;
        }

        if (this.y <= this.targetY) {
            fireworks.push(new Firework(this.x, this.y, this.color, this.isColorful, this.isGradient, this.isMonochrome));
            return true;
        }
        return false;
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        for (const point of this.trail) {
            ctx.lineTo(point.x, point.y);
        }
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

const fireworks = [];
const risingFireworks = [];

function randomColor() {
    const r = Math.floor(Math.random() * 255);
    const g = Math.floor(Math.random() * 255);
    const b = Math.floor(Math.random() * 255);
    return `rgb(${r},${g},${b})`;
}

let lastClickTime = 0;
const CLICK_COOLDOWN = 500;

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    risingFireworks.forEach((firework, index) => {
        if (firework.update()) {
            risingFireworks.splice(index, 1);
        }
        firework.draw();
    });
    fireworks.forEach((firework, index) => {
        firework.update();
        firework.draw();
        if (firework.particles.length === 0) {
            fireworks.splice(index, 1);
        }
    });
    requestAnimationFrame(animate);
}

function autoLaunch() {
    if (Date.now() - lastClickTime < CLICK_COOLDOWN) {
        return;
    }

    if (fireworks.length + risingFireworks.length < config.maxFireworks) {
        const isColorful = config.colorfulEnabled && Math.random() > 0.5;
        const isGradient = config.gradientEnabled && Math.random() > 0.5;
        const isMonochrome = config.monochromeEnabled;
        const risingFirework = new RisingFirework(
            Math.random() * canvas.width,
            canvas.height,
            Math.random() * (canvas.height * 0.6),
            isColorful,
            isGradient,
            isMonochrome
        );
        risingFireworks.push(risingFirework);
    }
}

canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const clickX = touch.clientX - rect.left;
    const clickY = touch.clientY - rect.top;

    if (fireworks.length + risingFireworks.length < config.maxFireworks + 5) {
        const isColorful = config.colorfulEnabled && Math.random() > 0.5;
        const isGradient = config.gradientEnabled && Math.random() > 0.5;
        const isMonochrome = config.monochromeEnabled;
        const risingFirework = new RisingFirework(clickX, canvas.height, clickY, isColorful, isGradient, isMonochrome);
        risingFireworks.push(risingFirework);
    }
});

let autoLaunchInterval = null;

document.addEventListener('click', () => {
    if (startPrompt.style.display !== 'none') {
        startPrompt.style.display = 'none';
        autoLaunchInterval = setInterval(autoLaunch, config.launchInterval);
    }
}, { once: true });

animate();

const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.querySelector('.settings-content');
const particleCountInput = document.getElementById('particleCount');
const launchIntervalInput = document.getElementById('launchInterval');
const risingSpeedInput = document.getElementById('risingSpeed');
const fadeSpeedInput = document.getElementById('fadeSpeed');
const maxFireworksInput = document.getElementById('maxFireworks');
const gravityInput = document.getElementById('gravity');
const colorfulToggle = document.getElementById('colorfulToggle');
const gradientToggle = document.getElementById('gradientToggle');
const monochromeToggle = document.getElementById('monochromeToggle');
const heartEffectToggle = document.getElementById('heartEffectToggle');

settingsToggle.addEventListener('click', () => {
    const isHidden = settingsContent.style.display === 'none' || !settingsContent.style.display;
    settingsContent.style.display = isHidden ? 'block' : 'none';
});

function updateValueDisplay(input, valueId) {
    document.getElementById(valueId).textContent = input.value;
}

particleCountInput.addEventListener('input', (e) => {
    config.particleCount = parseInt(e.target.value);
    updateValueDisplay(particleCountInput, 'particleCountValue');
});

launchIntervalInput.addEventListener('input', (e) => {
    config.launchInterval = parseInt(e.target.value);
    updateValueDisplay(launchIntervalInput, 'launchIntervalValue');
    clearInterval(autoLaunchInterval);
    autoLaunchInterval = setInterval(autoLaunch, config.launchInterval);
});

risingSpeedInput.addEventListener('input', (e) => {
    config.risingSpeed = parseInt(e.target.value);
    updateValueDisplay(risingSpeedInput, 'risingSpeedValue');
});

fadeSpeedInput.addEventListener('input', (e) => {
    config.fadeSpeed = parseInt(e.target.value);
    updateValueDisplay(fadeSpeedInput, 'fadeSpeedValue');
});

maxFireworksInput.addEventListener('input', (e) => {
    config.maxFireworks = parseInt(e.target.value);
    updateValueDisplay(maxFireworksInput, 'maxFireworksValue');
});

gravityInput.addEventListener('input', (e) => {
    config.gravity = parseFloat(e.target.value);
    updateValueDisplay(gravityInput, 'gravityValue');
});

colorfulToggle.addEventListener('change', (e) => {
    config.colorfulEnabled = e.target.checked;
});

gradientToggle.addEventListener('change', (e) => {
    config.gradientEnabled = e.target.checked;
});

monochromeToggle.addEventListener('change', (e) => {
    config.monochromeEnabled = e.target.checked;
});

heartEffectToggle.addEventListener('change', (e) => {
    config.heartEffectEnabled = e.target.checked;
});

const soundToggle = document.getElementById('soundToggle');
const soundVolume = document.getElementById('soundVolume');

soundToggle.addEventListener('change', (e) => {
    config.soundEnabled = e.target.checked;
});

soundVolume.addEventListener('input', (e) => {
    config.volume = parseFloat(e.target.value);
    updateValueDisplay(soundVolume, 'soundVolumeValue');
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});
