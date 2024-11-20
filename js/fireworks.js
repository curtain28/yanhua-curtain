// 获取画布元素
const canvas = document.getElementById('fireworks');
// 获取2D绘图上下文
const ctx = canvas.getContext('2d');

// 设置画布宽度为窗口宽度
canvas.width = window.innerWidth;
// 设置画布高度为窗口高度
canvas.height = window.innerHeight;

// 配置参数
const config = {
    particleCount: 500, // 粒子数量
    launchInterval: 300, // 发射间隔
    risingSpeed: 20, // 上升速度
    fadeSpeed: 2, // 衰减速度
    maxFireworks: 10, // 最大烟花数量
    soundEnabled: true, // 是否启用声音
    volume: 0.5, // 音量
    gravity: 0.05, // 重力
    heartEffectEnabled: true, // 是否启用心形效果
};

// 获取爆炸声音元素
const explosionSound = document.getElementById('explosion-sound');
// 获取开始提示元素
const startPrompt = document.getElementById('start-prompt');

// 粒子类
class Particle {
    constructor(x, y, color, angle, speed, life) {
        this.x = x; // 粒子x坐标
        this.y = y; // 粒子y坐标
        this.color = color; // 粒子颜色
        this.angle = angle; // 粒子角度
        this.speed = speed; // 粒子速度
        this.life = life; // 粒子寿命
        this.opacity = 1; // 粒子不透明度
        this.history = []; // 粒子历史轨迹
    }

    update() {
        this.history.push({ x: this.x, y: this.y }); // 记录历史轨迹
        if (this.history.length > 10) this.history.shift(); // 保持历史轨迹长度

        this.x += Math.cos(this.angle) * this.speed; // 更新x坐标
        this.y += Math.sin(this.angle) * this.speed + config.gravity; // 更新y坐标
        this.speed *= 0.98; // 减速
        this.life -= config.fadeSpeed / 100; // 减少寿命
        this.opacity = Math.max(0, this.life / 2); // 更新不透明度
    }

    draw() {
        ctx.globalAlpha = this.opacity; // 设置全局不透明度
        ctx.fillStyle = this.color; // 设置填充颜色

        if (this.life < 1 && config.heartEffectEnabled) {
            this.drawHeart(); // 绘制心形
        } else {
            ctx.beginPath(); // 开始路径
            ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); // 绘制圆形
            ctx.fill(); // 填充

            ctx.beginPath(); // 开始路径
            ctx.moveTo(this.x, this.y); // 移动到粒子位
            for (let i = this.history.length - 1; i >= 0; i--) {
                const point = this.history[i];
                ctx.lineTo(point.x, point.y); // 绘制历史轨迹
            }
            ctx.strokeStyle = this.color; // 设置描边颜色
            ctx.stroke(); // 描边
        }
    }

    drawHeart() {
        ctx.save(); // 保存当前状态
        ctx.translate(this.x, this.y); // 平移到粒子位置
        ctx.scale(0.1, 0.1); // 缩放
        ctx.beginPath(); // 开始路径
        ctx.moveTo(0, -50); // 移动到心形顶部
        ctx.bezierCurveTo(-25, -80, -50, -50, 0, 0); // 绘制左半边
        ctx.bezierCurveTo(50, -50, 25, -80, 0, -50); // 绘制右半边
        ctx.closePath(); // 关闭路径
        ctx.fill(); // 填充
        ctx.restore(); // 恢复状态
    }
}

// 添加生成随机渐变颜色的函数
function randomGradientColor() {
    // 生成一个随机色相
    const baseHue = Math.random() * 360;
    // 生成一个接近的色相，差异在150度以内
    const closeHue = (baseHue + (Math.random() * 150 - 15)) % 360;

    return {
        startColor: `hsl(${baseHue}, 100%, 50%)`,
        endColor: `hsl(${closeHue}, 100%, 50%)`
    };
}

// 烟花类
class Firework {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.particles = [];
        this.init();
    }

    init() {
        // 为整个烟花生成一对固定的渐变颜色
        const gradientColors = randomGradientColor();

        for (let i = 0; i < config.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            const life = Math.random() * 3 + 2;
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            // 简单的双色渐变
            const t = i / config.particleCount;
            const startHue = parseInt(gradientColors.startColor.match(/\d+/)[0]);
            const endHue = parseInt(gradientColors.endColor.match(/\d+/)[0]);
            
            // 计算最短路径的色相差值
            let hueDiff = endHue - startHue;
            if (Math.abs(hueDiff) > 180) {
                hueDiff = hueDiff > 0 ? hueDiff - 360 : hueDiff + 360;
            }
            
            const hue = (startHue + hueDiff * t + 360) % 360;
            const particleColor = `hsl(${hue}, 100%, 50%)`;

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

// 上升烟花类
class RisingFirework {
    constructor(x, y, targetY) {
        this.x = x;
        this.y = y;
        this.targetY = targetY;
        this.speed = config.risingSpeed;
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.trail = [];
        this.soundPlayed = false;
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
            fireworks.push(new Firework(this.x, this.y));
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

// 烟花数组
const fireworks = [];
// 上升烟花数组
const risingFireworks = [];

// 生成随机颜色
function randomColor() {
    const r = Math.floor(Math.random() * 255); // 随机红色值
    const g = Math.floor(Math.random() * 255); // 随机绿色值
    const b = Math.floor(Math.random() * 255); // 随机蓝色值
    return `rgb(${r},${g},${b})`; // 返回RGB颜色
}

let lastClickTime = 0; // 上次点击时间
const CLICK_COOLDOWN = 500; // 点击冷却时间

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // 清除画布
    risingFireworks.forEach((firework, index) => {
        if (firework.update()) {
            risingFireworks.splice(index, 1); // 移除已到达目标的上升烟花
        }
        firework.draw(); // 绘制上升烟花
    });
    fireworks.forEach((firework, index) => {
        firework.update(); // 更新烟花
        firework.draw(); // 绘制烟花
        if (firework.particles.length === 0) {
            fireworks.splice(index, 1); // 移除没有粒子的烟花
        }
    });
    requestAnimationFrame(animate); // 请求下一帧动画
}

// 在自动发射和点击事件之前添加检查函数
function getEnabledColorTypes() {
    const colorTypes = [];
    if (config.colorfulEnabled) colorTypes.push('colorful');
    if (config.gradientEnabled) colorTypes.push('gradient');
    return colorTypes;
}

// 修改动发射函数
function autoLaunch() {
    if (fireworks.length + risingFireworks.length < config.maxFireworks) {
        const risingFirework = new RisingFirework(
            Math.random() * canvas.width,
            canvas.height,
            Math.random() * (canvas.height * 0.6)
        );
        risingFireworks.push(risingFirework);
    }
}

// 修改点击事件监听器
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    const enabledColors = getEnabledColorTypes();
    if (enabledColors.length === 0) return; // 如果没有启用的颜色类型，不生成烟花

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (fireworks.length + risingFireworks.length < config.maxFireworks + 5) {
        const selectedTypes = {
            isColorful: enabledColors.includes('colorful'),
            isGradient: enabledColors.includes('gradient')
        };

        const risingFirework = new RisingFirework(
            clickX,
            canvas.height,
            clickY
        );
        risingFireworks.push(risingFirework);
    }
});

let autoLaunchInterval = null; // 自动发射间隔

// 点击事件监听
document.addEventListener('click', () => {
    if (startPrompt.style.display !== 'none') {
        startPrompt.style.display = 'none'; // 隐藏开始提示
        autoLaunchInterval = setInterval(autoLaunch, config.launchInterval); // 设置自动发射间隔
    }
}, { once: true }); // 只执行一次

animate(); // 开始动画

// 获取设置相关元素
const settingsToggle = document.getElementById('settings-toggle');
const settingsContent = document.querySelector('.settings-content');
const particleCountInput = document.getElementById('particleCount');
const launchIntervalInput = document.getElementById('launchInterval');
const risingSpeedInput = document.getElementById('risingSpeed');
const fadeSpeedInput = document.getElementById('fadeSpeed');
const maxFireworksInput = document.getElementById('maxFireworks');
const gravityInput = document.getElementById('gravity');
const heartEffectToggle = document.getElementById('heartEffectToggle');

// 设置切换事监听
settingsToggle.addEventListener('click', () => {
    const isHidden = settingsContent.style.display === 'none' || !settingsContent.style.display; // 判断设置是否隐藏
    settingsContent.style.display = isHidden ? 'block' : 'none'; // 切换显示状态
});

// 更新值显示
function updateValueDisplay(input, valueId) {
    document.getElementById(valueId).textContent = input.value; // 更新显值
}

// 粒子数量输入事件监听
particleCountInput.addEventListener('input', (e) => {
    config.particleCount = parseInt(e.target.value); // 更新粒子数量
    updateValueDisplay(particleCountInput, 'particleCountValue'); // 更新显示
});

// 发射间隔输入事件监听
launchIntervalInput.addEventListener('input', (e) => {
    config.launchInterval = parseInt(e.target.value); // 更新发射间隔
    updateValueDisplay(launchIntervalInput, 'launchIntervalValue'); // 新显示
    clearInterval(autoLaunchInterval); // 清除自动发射间隔
    autoLaunchInterval = setInterval(autoLaunch, config.launchInterval); // 置新的自动发射间隔
});

// 升速度输入事件监听
risingSpeedInput.addEventListener('input', (e) => {
    config.risingSpeed = parseInt(e.target.value); // 更新上升速度
    updateValueDisplay(risingSpeedInput, 'risingSpeedValue'); // 更新显示
});

// 衰减速度输入事件监听
fadeSpeedInput.addEventListener('input', (e) => {
    config.fadeSpeed = parseInt(e.target.value); // 更新衰减速度
    updateValueDisplay(fadeSpeedInput, 'fadeSpeedValue'); // 更新显示
});

// 最大烟花数量输入事件监听
maxFireworksInput.addEventListener('input', (e) => {
    config.maxFireworks = parseInt(e.target.value); // 更新最大烟花数量
    updateValueDisplay(maxFireworksInput, 'maxFireworksValue'); // 更新显示
});

// 重力输入事件监听
gravityInput.addEventListener('input', (e) => {
    config.gravity = parseFloat(e.target.value); // 更新重力
    updateValueDisplay(gravityInput, 'gravityValue'); // 更新显示
});

// 心形效果切换事件监听
heartEffectToggle.addEventListener('change', (e) => {
    config.heartEffectEnabled = e.target.checked; // 更新心形效果启用状态
});

// 获取声音相关元素
const soundToggle = document.getElementById('soundToggle');
const soundVolume = document.getElementById('soundVolume');

// 声音切换事件监听
soundToggle.addEventListener('change', (e) => {
    config.soundEnabled = e.target.checked; // 更新声音启用状态
});

// 声音量输入事件监听
soundVolume.addEventListener('input', (e) => {
    config.volume = parseFloat(e.target.value); // 更新音量
    updateValueDisplay(soundVolume, 'soundVolumeValue'); // 更新显
});

// 窗口大小改变事件监听
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth; // 更新画布宽度
    canvas.height = window.innerHeight; // 更新画布高度
});

// 修改事件监听器以支持触摸事件
canvas.addEventListener('touchstart', handleTouch);
canvas.addEventListener('click', handleClick);

// 添加触摸事件处理函数
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    createFirework(x, y);
}

// 点击事件处理函数
function handleClick(e) {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    createFirework(x, y);
}

// 抽取创建烟花的逻辑到单独的函数
function createFirework(x, y) {
    if (fireworks.length + risingFireworks.length < config.maxFireworks + 5) {
        const risingFirework = new RisingFirework(x, canvas.height, y);
        risingFireworks.push(risingFirework);
    }
}

// 添加视口调整逻辑
function resizeCanvas() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
}

// 监听视口变化
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// 初始化时调用一次
resizeCanvas();

// 添加阻止默认滚动行为
document.body.addEventListener('touchmove', (e) => {
    if (e.target === canvas) {
        e.preventDefault();
    }
}, { passive: false });

// 修改设置面板的触摸事件处理
settingsToggle.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const isHidden = settingsContent.style.display === 'none' || !settingsContent.style.display;
    settingsContent.style.display = isHidden ? 'block' : 'none';
});

// 添加meta标签（在HTML的head部分）
