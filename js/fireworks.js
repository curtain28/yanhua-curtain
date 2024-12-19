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
    particleCount: 500,         // 粒子数量: 500
    launchInterval: 200,        // 发射间隔: 200ms
    risingSpeed: 10,           // 上升速度: 10
    fadeSpeed: 5,              // 粒子消散速度: 5
    maxFireworks: 20,          // 最大烟花数量: 20
    gravity: 0.05,             // 粒子重力效果: 0.05
    interactionTimeout: 3000,   // 交互超时: 3000ms
    soundEnabled: true,         // 音效开关: 开启
    volume: 0.5,               // 音量: 0.5
    heartEffectEnabled: true,   // 爱心效果: 开启
    secondaryEnabled: true,     // 二级爆炸效果: 开启
    secondaryChance: 0.3,      // 二级爆炸概率: 30%
    secondaryParticleRatio: 0.2, // 二级粒子比例: 20%
    textParticles: {
        enabled: true,          // 文字效果: 开启
        probability: 0.5,       // 文字生成概率: 50%
        texts: [  
            "新年快乐",
            "恭喜发财",
            "万事如意",
            "心想事成",
            "吉祥如意",
            "大吉大利"
        ],
        fontSize: 100,          // 文字大小: 100
        color: "#ff8888",       // 恢复原来的颜色设置
        particleSize: 2,
        particleSpacing: 3
    }
};

// 获取爆炸声音元素
const explosionSound = document.getElementById('explosion-sound');
// 获取开始提示元素
const startPrompt = document.getElementById('start-prompt');

function isMobileDevice() {
    return window.innerWidth <= 1450; // 简单判断是否为移动设备
}

function getTargetY() {
    return Math.random() * (canvas.height / 3); // 目标位置限制在屏高度三分之一
}

// 粒子类
class Particle {
    constructor(x, y, color, angle, speed, life) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = angle;
        this.speed = speed;
        this.life = life;
        this.opacity = 0;  // 初始透明度为0
        this.history = [];
        this.fadeSpeed = 0.02;
        this.initialSpeed = speed;
        this.stayTime = 1;      // 停留时间1秒
        this.createTime = Date.now();
        this.initialX = x;      // 记���初始位置
        this.initialY = y;
        this.targetX = x;       // 目标位置
        this.targetY = y;
        this.appearProgress = 0; // 出现进度
        this.fadeOutSpeed = 0.5 + Math.random() * 0.5;  // 随机化消散速度
        this.fadeOutAngle = Math.random() * Math.PI * 2;  // 随机消散方向
    }

    update() {
        if (this.isTextParticle) {
            const existTime = (Date.now() - this.createTime) / 1000;
            
            if (existTime < 0.3) {  // 淡入阶段
                this.appearProgress = Math.min(1, existTime / 0.3);
                this.opacity = this.appearProgress;
                
                // 使用缓动函数使移动更平滑
                const easeProgress = this.easeOutCubic(this.appearProgress);
                this.x = this.initialX + (this.targetX - this.initialX) * easeProgress;
                this.y = this.initialY + (this.targetY - this.initialY) * easeProgress;
            } else if (existTime < this.stayTime) {  // 停留阶段
                this.opacity = 1;
                // 添加轻微的漂浮效果
                const floatTime = existTime * 2;
                this.x = this.targetX + Math.sin(floatTime) * 0.5;
                this.y = this.targetY + Math.cos(floatTime) * 0.5;
            } else {  // 淡出阶段
                const fadeTime = existTime - this.stayTime;
                const fadeProgress = Math.min(1, fadeTime / 1.5);
                
                // 缩减消散范围，使用更温和的扩散效果
                const spread = Math.pow(fadeProgress, 2) * 30; // 将100改为30
                const spreadX = Math.cos(this.fadeOutAngle) * spread * this.fadeOutSpeed;
                const spreadY = Math.sin(this.fadeOutAngle) * spread * this.fadeOutSpeed;
                
                // 减小向下的运动
                this.x = this.targetX + spreadX;
                this.y = this.targetY + spreadY + fadeProgress * 8; // 将20改为8
                
                this.opacity = Math.max(0, 1 - Math.pow(fadeProgress, 1.5));
                
                if (this.opacity <= 0) {
                    this.life = 0;
                }
            }
        } else {
            // 普通烟花粒子的更新逻辑保持不变
            this.history.push({ x: this.x, y: this.y });
            if (this.history.length > 10) this.history.shift();
            
            this.x += Math.cos(this.angle) * this.speed;
            this.y += Math.sin(this.angle) * this.speed + config.gravity;
            this.speed *= 0.98;
            this.life -= config.fadeSpeed / 100;
            this.opacity = Math.max(0, this.life / 2);
        }
    }

    // 添加缓动函数
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    draw() {
        if (this.isTextParticle) {
            // 文字粒子的特殊绘制
            ctx.globalAlpha = this.opacity;
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, config.textParticles.particleSize, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 原有的粒子绘制逻辑
            if (isMobileDevice() && this.opacity <= 0) return; // 仅在移动设备上跳过不必要的绘制

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
    // 生成一个接近的色相，异在150度以内
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
        this.secondaryFireworks = []; // 存储二级烟花
        this.init();
    }

    init() {
        const gradientColors = randomGradientColor();
        
        // 主爆炸
        for (let i = 0; i < config.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 0.5;
            const life = Math.random() * 3 + 2;
            const offsetX = (Math.random() - 0.5) * 20;
            const offsetY = (Math.random() - 0.5) * 20;

            // 颜色渐变计算
            const t = i / config.particleCount;
            const startHue = parseInt(gradientColors.startColor.match(/\d+/)[0]);
            const endHue = parseInt(gradientColors.endColor.match(/\d+/)[0]);
            
            let hueDiff = endHue - startHue;
            if (Math.abs(hueDiff) > 180) {
                hueDiff = hueDiff > 0 ? hueDiff - 360 : hueDiff + 360;
            }
            
            const hue = (startHue + hueDiff * t + 360) % 360;
            const particleColor = `hsl(${hue}, 100%, 50%)`;

            this.particles.push(new Particle(this.x + offsetX, this.y + offsetY, particleColor, angle, speed, life));
        }

        // 修改二级烟花轨道
        if (config.secondaryEnabled && Math.random() < config.secondaryChance) {
            // 随机生成1-3个二级烟花
            const count = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < count; i++) {
                // 随机角度，但避免向下发射
                const angle = (Math.random() * 1.5 + 0.25) * Math.PI;
                const speed = 4 + Math.random() * 3;
                
                this.secondaryFireworks.push({
                    x: this.x,
                    y: this.y,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed - 2,
                    color: gradientColors.startColor,
                    timer: 20 + Math.random() * 15,
                    hasExploded: false,
                    trail: []
                });
            }
        }

        // 修改文字粒子生成逻辑
        if (config.textParticles.enabled && Math.random() < config.textParticles.probability) {
            const currentTime = Date.now();
            
            // 清理过期的位置记录
            while (textPositionHistory.length > 0 && 
                   currentTime - textPositionHistory[0].time > TEXT_POSITION_COOLDOWN) {
                textPositionHistory.shift();
            }

            // 检查是否与所有现有文字保持足够距离
            const isPositionValid = !textPositionHistory.some(pos => {
                const dx = pos.x - this.x;
                const dy = pos.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                return distance < TEXT_POSITION_THRESHOLD;
            });

            // 如果位置有效，则生成文字
            if (isPositionValid) {
                // 记录当前位置
                textPositionHistory.push({
                    x: this.x,
                    y: this.y,
                    time: currentTime
                });

                // 获取当前文字并更新索引
                const currentText = config.textParticles.texts[currentTextIndex];
                currentTextIndex = (currentTextIndex + 1) % config.textParticles.texts.length;

                // 生成文字粒子
                const textParticles = getTextParticles(
                    currentText,  // 使用当前文字
                    this.x,
                    this.y,
                    config.textParticles.fontSize,
                    config.textParticles.particleSpacing
                );
                
                this.particles.push(...textParticles);
            }
        }
    }

    update() {
        // 更新主爆炸子
        this.particles.forEach((particle, index) => {
            particle.update();
            if (particle.life <= 0) {
                this.particles.splice(index, 1);
            }
        });

        // 更新二级烟花
        this.secondaryFireworks.forEach((secondary) => {
            if (!secondary.hasExploded) {
                // 记录轨迹
                secondary.trail.push({ x: secondary.x, y: secondary.y });
                if (secondary.trail.length > 10) {
                    secondary.trail.shift();
                }

                // 更新位置，应用重力效果造抛物线
                secondary.x += secondary.vx;
                secondary.y += secondary.vy;
                secondary.vy += config.gravity * 1.5; // 增加重力效果
                secondary.timer--;

                // 到达指定时间后爆炸
                if (secondary.timer <= 0) {
                    secondary.hasExploded = true;
                    // 使用配置的粒子例
                    const particleCount = Math.floor(config.particleCount * config.secondaryParticleRatio);
                    for (let i = 0; i < particleCount; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        const speed = Math.random() * 1.5 + 0.5;
                        const life = Math.random() * 2 + 1;
                        const particle = new Particle(
                            secondary.x,
                            secondary.y,
                            secondary.color,
                            angle,
                            speed,
                            life
                        );
                        this.particles.push(particle);
                    }
                }
            }
        });

        // 移除已爆炸的二级烟花
        this.secondaryFireworks = this.secondaryFireworks.filter(secondary => !secondary.hasExploded);
    }

    draw() {
        // 绘制所有粒子
        this.particles.forEach(particle => particle.draw());

        // 绘制二级烟花轨迹
        this.secondaryFireworks.forEach(secondary => {
            if (!secondary.hasExploded) {
                // 绘制轨迹
                ctx.beginPath();
                ctx.moveTo(secondary.x, secondary.y);
                secondary.trail.forEach(point => {
                    ctx.lineTo(point.x, point.y);
                });
                ctx.strokeStyle = secondary.color;
                ctx.lineWidth = 2;
                ctx.stroke();

                // 绘制烟花点
                ctx.beginPath();
                ctx.arc(secondary.x, secondary.y, 2, 0, Math.PI * 2);
                ctx.fillStyle = secondary.color;
                ctx.fill();
            }
        });
    }
}

// 添加尾迹粒子类
class TrailParticle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.alpha = 1;
        this.size = Math.random() * 2 + 1;
    }

    update() {
        this.alpha *= 0.92; // 控制粒子消失速度
        this.size *= 0.96; // 控制粒子大小变化
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// 修改 RisingFirework 类
class RisingFirework {
    constructor(x, y, targetY, speed) {
        this.x = Math.max(0, Math.min(x, canvas.width));
        this.y = y;
        this.targetY = Math.max(0, Math.min(targetY, canvas.height / 3));
        this.speed = speed || config.risingSpeed;
        this.color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        this.trailParticles = [];
        this.soundPlayed = false;
        
        // 修改摆动相关参数
        this.wobbleFrequency = Math.random() * 0.2 + 0.1; // 摆动频率
        this.wobbleAmplitude = Math.random() * 0.8 + 0.2; // 摆动幅度
        this.time = 0; // 用于计算摆动
        
        // 尾迹参数
        this.lastX = x; // 记录上一帧的位置
        this.lastY = y;
    }

    update() {
        this.time += this.wobbleFrequency;
        
        // 计算水平摆动
        const horizontalOffset = Math.sin(this.time) * this.wobbleAmplitude;
        
        // 新位置 - 保持垂直上升只在水平方向摆动
        this.x += horizontalOffset;
        this.y -= this.speed;
        
        // 限制水平移动范围
        const maxOffset = 30; // 最大水平偏移
        if (Math.abs(this.x - this.lastX) > maxOffset) {
            this.x = this.lastX + (maxOffset * Math.sign(this.x - this.lastX));
        }

        // 添加尾迹粒子
        const dx = this.x - this.lastX;
        const dy = this.y - this.lastY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 根据移动距离添加更多的尾粒子
        const particleCount = Math.ceil(distance / 2);
        for (let i = 0; i < particleCount; i++) {
            const t = i / particleCount;
            const particleX = this.lastX + dx * t;
            const particleY = this.lastY + dy * t;
            
            if (Math.random() < 0.3) {
                this.trailParticles.push(new TrailParticle(
                    particleX + (Math.random() - 0.5) * 2,
                    particleY + (Math.random() - 0.5) * 2,
                    this.color
                ));
            }
        }

        // 更新尾迹粒子
        this.trailParticles.forEach((particle, index) => {
            particle.update();
            if (particle.alpha < 0.05) {
                this.trailParticles.splice(index, 1);
            }
        });

        // 更新上一帧位置
        this.lastX = this.x;
        this.lastY = this.y;

        // 声音播放逻辑
        if (!this.soundPlayed && this.y - this.targetY <= this.speed * 25) {
            if (config.soundEnabled) {
                const sound = explosionSound.cloneNode();
                sound.volume = config.volume;
                sound.play().catch(e => console.log('音频播放失败:', e));
            }
            this.soundPlayed = true;
        }

        // 检查是否到达目标高度
        if (this.y <= this.targetY) {
            fireworks.push(new Firework(this.x, this.y));
            return true;
        }
        return false;
    }

    draw() {
        // 绘制尾迹粒子
        this.trailParticles.forEach(particle => {
            particle.draw();
        });

        // 绘制主体花 - 增大大小
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        // 绘制发光效果 - 增加光范围
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, 8
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, 0.4)`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.beginPath();
        ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
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

// 添加新的变量来跟踪用户交互
let userInteractionTimer = null;
const CLICK_COOLDOWN = 100; // 点击冷却时间到100ms
let lastClickTime = Date.now();

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

// 在自动射和击事件之前添加检查函数
function getEnabledColorTypes() {
    const colorTypes = [];
    if (config.colorfulEnabled) colorTypes.push('colorful');
    if (config.gradientEnabled) colorTypes.push('gradient');
    return colorTypes;
}

// 添加一个变量来跟踪自动发射状态
let autoLaunchEnabled = true;

// 修改 createFirework 函数
function createFirework(x, y) {
    const currentTime = Date.now();
    if (currentTime - lastClickTime < CLICK_COOLDOWN) return;
    lastClickTime = currentTime;

    if (fireworks.length + risingFireworks.length < config.maxFireworks + 5) {
        // 停止自动发射
        clearInterval(autoLaunchInterval);
        autoLaunchEnabled = false;
        
        // 创建新的烟花
        const risingFirework = new RisingFirework(
            x,
            canvas.height,
            y,
            config.risingSpeed * 1.2
        );
        risingFireworks.push(risingFirework);

        // 1秒后重新启动自动发射
        setTimeout(() => {
            if (!autoLaunchEnabled) {
                autoLaunchEnabled = true;
                autoLaunchInterval = setInterval(autoLaunch, config.launchInterval);
            }
        }, 1000);
    }
}

// 修改 autoLaunch 函数
function autoLaunch() {
    if (!autoLaunchEnabled) return;
    
    const maxFireworks = config.maxFireworks;
    if (fireworks.length + risingFireworks.length < maxFireworks) {
        const fireworksToLaunch = Math.min(maxFireworks - (fireworks.length + risingFireworks.length), 3);
        for (let i = 0; i < fireworksToLaunch; i++) {
            const xPosition = Math.random() * canvas.width;
            const targetYPosition = getTargetY();
            const risingFirework = new RisingFirework(
                xPosition,
                canvas.height,
                targetYPosition
            );
            risingFireworks.push(risingFirework);
        }
    }
}

// 修改点击事件监听器
canvas.addEventListener('click', (e) => {
    e.preventDefault();
    const enabledColors = getEnabledColorTypes();
    if (enabledColors.length === 0) return; // 如果没有启用的颜色类，不生成花

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

// 设置��换事监听
settingsToggle.addEventListener('click', () => {
    const isHidden = settingsContent.style.display === 'none' || !settingsContent.style.display; // 判断置是否隐藏
    settingsContent.style.display = isHidden ? 'block' : 'none'; // 切换显示状��
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

// 发射间隔输入件监听
launchIntervalInput.addEventListener('input', (e) => {
    config.launchInterval = parseInt(e.target.value); // 更新发射间隔
    updateValueDisplay(launchIntervalInput, 'launchIntervalValue'); // 新示
    clearInterval(autoLaunchInterval); // 清除自动射间隔
    autoLaunchInterval = setInterval(autoLaunch, config.launchInterval); // 置新自动发射间隔
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

// 心效果切换事件监听
heartEffectToggle.addEventListener('change', (e) => {
    config.heartEffectEnabled = e.target.checked; // 更新心形果启状态
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
    updateValueDisplay(soundVolume, 'soundVolumeValue'); // 更新显示
});

// 窗口大小改变件监听
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth; // 更新画布宽度
    canvas.height = window.innerHeight; // 更新画布高度
});

// 修改事件监听��以支持触摸事件
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

// 监听视口化
window.addEventListener('resize', resizeCanvas);
window.addEventListener('orientationchange', resizeCanvas);

// 初始化时调用次
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

// 添加meta标（在HTML的head部分）

// 获取交互超时时间输入元素
const interactionTimeoutInput = document.getElementById('interactionTimeout');

// 在文件末尾添加新的控制逻辑
const secondaryExplosionToggle = document.getElementById('secondaryExplosionToggle');
const secondaryExplosionChance = document.getElementById('secondaryExplosionChance');
const secondaryParticleRatio = document.getElementById('secondaryParticleRatio');

// 二级爆炸开关事件监听
secondaryExplosionToggle.addEventListener('change', (e) => {
    config.secondaryEnabled = e.target.checked;
});

// 二级爆炸概率事件监听
secondaryExplosionChance.addEventListener('input', (e) => {
    config.secondaryChance = parseInt(e.target.value) / 100;
    updateValueDisplay(secondaryExplosionChance, 'secondaryExplosionChanceValue');
});

// 二级粒子比事监听
secondaryParticleRatio.addEventListener('input', (e) => {
    config.secondaryParticleRatio = parseInt(e.target.value) / 100;
    updateValueDisplay(secondaryParticleRatio, 'secondaryParticleRatioValue');
});

// 添加文字粒子生成函数
function getTextParticles(text, x, y, fontSize, spacing) {
    // 计算安全区域(屏幕中心70%的区域)
    const safeArea = {
        minX: window.innerWidth * 0.15,
        maxX: window.innerWidth * 0.85,
        minY: window.innerHeight * 0.15,
        maxY: window.innerHeight * 0.85
    };

    // ��查位置是否在安全区域内
    if (x < safeArea.minX || x > safeArea.maxX || 
        y < safeArea.minY || y > safeArea.maxY) {
        return []; // 如果不在安全区域内，回空数组，不生成文字
    }

    const particles = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布大小
    ctx.font = `${fontSize}px Arial`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // 调整位置确文字在屏幕内
    const safeX = Math.min(Math.max(x, textWidth / 2 + safeArea.minX), safeArea.maxX - textWidth / 2);
    const safeY = Math.min(Math.max(y, textHeight / 2 + safeArea.minY), safeArea.maxY - textHeight / 2);
    
    canvas.width = textWidth;
    canvas.height = textHeight;
    
    // 绘制文字
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = 'white';
    ctx.textBaseline = 'top';
    ctx.fillText(text, 0, 0);
    
    // 获取像素数据
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // 为每个文字生成渐变色
    const gradientColors = getRandomGradientColors();
    
    // 修改粒子生成部分
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i + 3] > 128) {
            const px = (i / 4) % canvas.width;
            const py = Math.floor((i / 4) / canvas.width);
            
            if (px % spacing === 0 && py % spacing === 0) {
                // 计算渐变色
                const progress = px / canvas.width;
                const hue1 = parseInt(gradientColors.start.match(/\d+/)[0]);
                const hue2 = parseInt(gradientColors.end.match(/\d+/)[0]);
                let hueDiff = hue2 - hue1;
                if (Math.abs(hueDiff) > 180) {
                    hueDiff = hueDiff > 0 ? hueDiff - 360 : hueDiff + 360;
                }
                const currentHue = (hue1 + hueDiff * progress + 360) % 360;
                const color = `hsl(${currentHue}, 90%, 55%)`;

                // 减小初始随机偏移范围
                const randomRadius = 20 + Math.random() * 30;
                const randomAngle = Math.random() * Math.PI * 2;
                
                const particle = new Particle(
                    x + Math.cos(randomAngle) * randomRadius,  // 随机圆形区域内的起始位置
                    y + Math.sin(randomAngle) * randomRadius,
                    color,
                    Math.random() * Math.PI * 2,
                    0.1 + Math.random() * 0.2,
                    5
                );
                
                // 设置目标位置（添加细微偏移）
                particle.targetX = x + px - textWidth / 2 + (Math.random() - 0.5) * 2;
                particle.targetY = y + py - textHeight / 2 + (Math.random() - 0.5) * 2;
                particle.initialX = particle.x;
                particle.initialY = particle.y;
                
                particle.isTextParticle = true;
                particles.push(particle);
            }
        }
    }

    return particles;
}

// 在文件顶部添加新的变量来跟踪文字位置
const textPositionHistory = [];
const TEXT_POSITION_COOLDOWN = 2000; // 文字位置冷却时间(毫秒)
const TEXT_POSITION_THRESHOLD = 400; // 增加判断位置重复的距离阈值到400像素

// 获取新添加的控制元素
const textEffectToggle = document.getElementById('textEffectToggle');
const textProbability = document.getElementById('textProbability');
const mainFontSize = document.getElementById('mainFontSize');

// 文字效果开关事件监听
textEffectToggle.addEventListener('change', (e) => {
    config.textParticles.enabled = e.target.checked;
});

// 文字生成概率事件监听
textProbability.addEventListener('input', (e) => {
    config.textParticles.probability = parseInt(e.target.value) / 100;
    updateValueDisplay(textProbability, 'textProbabilityValue');
});

// 文字大小事件监听
mainFontSize.addEventListener('input', (e) => {
    config.textParticles.fontSize = parseInt(e.target.value);
    updateValueDisplay(mainFontSize, 'mainFontSizeValue');
});

// 在文件顶部添加一个变量来跟踪当前文字索引
let currentTextIndex = 0;

// 在文件顶部添加一个生成随机HSL颜色的函数
function getRandomBrightColor() {
    // 使用HSL颜色空间，保证颜色鲜艳
    const hue = Math.random() * 360;  // 随机色相
    const saturation = 80 + Math.random() * 20;  // 80-100的饱和度
    const lightness = 50 + Math.random() * 10;   // 50-60的亮度
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// 修改生成渐变色的函数
function getRandomGradientColors() {
    // 生成基础色相
    const baseHue = Math.random() * 360;
    // 结束色相与开始色相相差15-45度，确保颜色相近
    const hueDiff = 15 + Math.random() * 30;
    const endHue = (baseHue + hueDiff) % 360;
    
    // 使用较高的饱和度和亮度使颜色更鲜艳
    const saturation = 90 + Math.random() * 10;  // 90-100的饱和度
    const lightness = 55 + Math.random() * 10;   // 55-65的亮度
    
    return {
        start: `hsl(${baseHue}, ${saturation}%, ${lightness}%)`,
        end: `hsl(${endHue}, ${saturation}%, ${lightness}%)`
    };
}

// 只保留交互超时时间的初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置交互超时时间的初始值
    interactionTimeoutInput.value = config.interactionTimeout;
    updateValueDisplay(interactionTimeoutInput, 'interactionTimeoutValue');
    
    // 添加事件监听
    interactionTimeoutInput.addEventListener('input', (e) => {
        config.interactionTimeout = parseInt(e.target.value);
        updateValueDisplay(interactionTimeoutInput, 'interactionTimeoutValue');
    });
});

