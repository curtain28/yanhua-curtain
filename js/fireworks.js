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
    particleCount: 1000, // 粒子数量
    launchInterval: 500, // 发射间隔
    risingSpeed: 10, // 上升速度
    fadeSpeed: 4, // 衰减速度
    maxFireworks: 10, // 最大烟花数量
    soundEnabled: true, // 是否启用声音
    volume: 0.5, // 音量
    gravity: 0.05, // 重力
    colorfulEnabled: true, // 默认启用多彩效果
    gradientEnabled: true, // 默认启用渐变效果
    heartEffectEnabled: true, // 是否启用心形效果
    mixedEnabled: true, // 新增融合效果配置
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
            ctx.moveTo(this.x, this.y); // 移动到粒子位置
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

// 生成随机渐变颜色
function randomGradientColor() {
    const startColor = `hsl(${Math.random() * 360}, 100%, 50%)`; // 起始颜色
    const endColor = `hsl(${Math.random() * 360}, 100%, 50%)`; // 结束颜色
    return { startColor, endColor }; // 返回颜色对象
}

// 烟花类
class Firework {
    constructor(x, y, color, isColorful = false, isGradient = false) {
        this.x = x; // 烟花x坐标
        this.y = y; // 烟花y坐标
        this.color = color; // 烟花颜色
        this.isColorful = isColorful; // 是否多彩
        this.isGradient = isGradient; // 是否渐变
        this.particles = []; // 粒子数组
        
        // 检查是否有启用的颜色类型
        const enabledColors = getEnabledColorTypes();
        if (enabledColors.length > 0) {
            this.init();
        }
    }

    init() {
        const gradientColors = randomGradientColor();
        let colorType;

        // 确定可用的颜色类型
        const availableTypes = [];
        if (this.isGradient && config.gradientEnabled) availableTypes.push('gradient');
        if (this.isColorful && config.colorfulEnabled) availableTypes.push('colorful');
        if (config.mixedEnabled) availableTypes.push('mixed');

        if (availableTypes.length === 0) return;

        // 随机选择一种颜色类型
        colorType = availableTypes[Math.floor(Math.random() * availableTypes.length)];

        for (let i = 0; i < config.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            const life = Math.random() * 3 + 2;
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            let particleColor;
            switch (colorType) {
                case 'colorful':
                    particleColor = randomColor();
                    break;
                case 'gradient':
                    const t = i / config.particleCount;
                    particleColor = `hsl(${(1 - t) * parseInt(gradientColors.startColor.match(/\d+/)[0]) + 
                        t * parseInt(gradientColors.endColor.match(/\d+/)[0])}, 100%, 50%)`;
                    break;
                case 'mixed':
                    // 对每个粒子随机选择是使用彩色还是渐变色
                    if (Math.random() < 0.5) {
                        particleColor = randomColor();
                    } else {
                        const t = i / config.particleCount;
                        particleColor = `hsl(${(1 - t) * parseInt(gradientColors.startColor.match(/\d+/)[0]) + 
                            t * parseInt(gradientColors.endColor.match(/\d+/)[0])}, 100%, 50%)`;
                    }
                    break;
            }

            this.particles.push(new Particle(this.x + offsetX, this.y + offsetY, particleColor, angle, speed, life));
        }
    }

    update() {
        this.particles.forEach((particle, index) => {
            particle.update(); // 更新粒子
            if (particle.life <= 0) {
                this.particles.splice(index, 1); // 移除寿命结束的粒子
            }
        });
    }

    draw() {
        this.particles.forEach(particle => particle.draw()); // 绘制粒子
    }
}

// 上升烟花类
class RisingFirework {
    constructor(x, y, targetY, isColorful = false, isGradient = false) {
        this.x = x; // 烟花x坐标
        this.y = y; // 烟花y坐标
        this.targetY = targetY; // 目标y坐标
        this.speed = config.risingSpeed; // 上升速度
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`; // 烟花颜色
        this.trail = []; // 轨迹数组
        this.soundPlayed = false; // 声音播放标志
        this.isColorful = isColorful; // 是否多彩
        this.isGradient = isGradient; // 是否渐变
    }

    update() {
        this.trail.push({ x: this.x, y: this.y }); // 记录轨迹
        if (this.trail.length > 3) this.trail.shift(); // 保持轨迹长度

        this.y -= this.speed; // 更新y坐标

        if (!this.soundPlayed && this.y - this.targetY <= this.speed * 25) {
            if (config.soundEnabled) {
                const sound = explosionSound.cloneNode(); // 克隆声音节点
                sound.volume = config.volume; // 设置音量
                sound.play().catch(e => console.log('音频播放失败:', e)); // 播放��音
            }
            this.soundPlayed = true; // 标记声音已播放
        }

        if (this.y <= this.targetY) {
            fireworks.push(new Firework(this.x, this.y, this.color, this.isColorful, this.isGradient)); // 创建烟花
            return true; // 返回true表示到达目标
        }
        return false; // 返回false表示未到达目标
    }

    draw() {
        ctx.beginPath(); // 开始路径
        ctx.moveTo(this.x, this.y); // 移动到烟花位置
        for (const point of this.trail) {
            ctx.lineTo(point.x, point.y); // 绘制轨迹
        }
        ctx.strokeStyle = this.color; // 设置描边颜色
        ctx.lineWidth = 1; // 设置线宽
        ctx.stroke(); // 描边

        ctx.beginPath(); // 开始路径
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2); // 绘制圆形
        ctx.fillStyle = this.color; // 设置填充颜色
        ctx.fill(); // 填充
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

// 修改自动发射函数
function autoLaunch() {
    const enabledColors = getEnabledColorTypes();
    if (enabledColors.length === 0) return; // 如果没有启用的颜色类型，不生成烟花

    if (fireworks.length + risingFireworks.length < config.maxFireworks) {
        const selectedTypes = {
            isColorful: enabledColors.includes('colorful'),
            isGradient: enabledColors.includes('gradient')
        };

        const risingFirework = new RisingFirework(
            Math.random() * canvas.width,
            canvas.height,
            Math.random() * (canvas.height * 0.6),
            selectedTypes.isColorful,
            selectedTypes.isGradient
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
            clickY,
            selectedTypes.isColorful,
            selectedTypes.isGradient
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
const colorfulToggle = document.getElementById('colorfulToggle');
const gradientToggle = document.getElementById('gradientToggle');
const monochromeToggle = document.getElementById('monochromeToggle');
const heartEffectToggle = document.getElementById('heartEffectToggle');
const mixedToggle = document.getElementById('mixedToggle');

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
    updateValueDisplay(launchIntervalInput, 'launchIntervalValue'); // 更新显示
    clearInterval(autoLaunchInterval); // 清除自动发射间隔
    autoLaunchInterval = setInterval(autoLaunch, config.launchInterval); // 置新的自动发射间隔
});

// 上升速度输入事件监听
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

// 多彩切换事件监听
colorfulToggle.addEventListener('change', (e) => {
    config.colorfulEnabled = e.target.checked;
    if (!e.target.checked || !gradientToggle.checked) {
        config.mixedEnabled = false;
        mixedToggle.checked = false;
    }
});

// 渐变切换事件监听
gradientToggle.addEventListener('change', (e) => {
    config.gradientEnabled = e.target.checked;
    if (!e.target.checked || !colorfulToggle.checked) {
        config.mixedEnabled = false;
        mixedToggle.checked = false;
    }
});

// 心形效果切换事件监听
heartEffectToggle.addEventListener('change', (e) => {
    config.heartEffectEnabled = e.target.checked; // 更新心形效果启用状态
});

// 融合效果切换事件监听
mixedToggle.addEventListener('change', (e) => {
    if (colorfulToggle.checked && gradientToggle.checked) {
        config.mixedEnabled = e.target.checked;
    } else {
        config.mixedEnabled = false;
        e.target.checked = false;
    }
});

// 获取声音相关元素
const soundToggle = document.getElementById('soundToggle');
const soundVolume = document.getElementById('soundVolume');

// 声音切换事件监听
soundToggle.addEventListener('change', (e) => {
    config.soundEnabled = e.target.checked; // 更新声音启用状态
});

// 声音音量输入事件监听
soundVolume.addEventListener('input', (e) => {
    config.volume = parseFloat(e.target.value); // 更新音量
    updateValueDisplay(soundVolume, 'soundVolumeValue'); // 更新显示
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
    const enabledColors = getEnabledColorTypes();
    if (enabledColors.length === 0) return;

    if (fireworks.length + risingFireworks.length < config.maxFireworks + 5) {
        const selectedTypes = {
            isColorful: enabledColors.includes('colorful'),
            isGradient: enabledColors.includes('gradient')
        };

        const risingFirework = new RisingFirework(
            x,
            canvas.height,
            y,
            selectedTypes.isColorful,
            selectedTypes.isGradient
        );
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
