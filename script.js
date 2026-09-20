const canvas = document.querySelector('#heart');
const context = canvas.getContext('2d');
const music = document.querySelector('#music');
const playButton = document.querySelector('#playButton');
const controls = document.querySelector('#controls');

const words = ['love you', 'Love You', 'LOVE YOU'];
const colors = ['#4682b4', '#1e90ff', '#00bfff', '#6495ed', '#4169e1'];
const centerText = 'Love You';

let width = 0;
let height = 0;
let devicePixelRatio = 1;
let particles = [];
let stars = [];
let centerAt = 0;
let cycleLength = 0;
let cycleStartedAt = performance.now();

function heartPoint(angle) {
  return [
    16 * Math.sin(angle) ** 3,
    -(13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)),
  ];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function makeParticle(angle, radius, delay, size) {
  const scale = Math.min(width / 43, height / 37);
  const [heartX, heartY] = heartPoint(angle);
  return {
    x: width / 2 + heartX * radius * scale,
    y: height / 2 - Math.min(18, height * .025) + heartY * radius * scale,
    delay,
    size,
    word: words[Math.floor(Math.random() * words.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    flicker: Math.random() * Math.PI * 2,
    angle: Math.atan2(heartY, heartX),
  };
}

function buildHeart() {
  const outlineCount = Math.max(90, Math.min(175, Math.round(width / 7)));
  const fillCount = Math.max(65, Math.min(145, Math.round(width / 11)));
  const outline = Array.from({ length: outlineCount }, (_, index) =>
    makeParticle(index / outlineCount * Math.PI * 2, 1, index * 22, 1.08),
  );
  const fill = Array.from({ length: fillCount }, () =>
    makeParticle(Math.random() * Math.PI * 2, Math.sqrt(Math.random()) * .88, outlineCount * 22 + 550 + Math.random() * 850, .82 + Math.random() * .35),
  );
  particles = [...outline, ...fill];
  stars = Array.from({ length: Math.max(42, Math.round(width / 22)) }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    radius: .35 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2,
  }));
  centerAt = Math.max(...particles.map((particle) => particle.delay)) + 350;
  cycleLength = centerAt + 4_800;
  cycleStartedAt = performance.now();
}

function resize() {
  devicePixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.round(width * devicePixelRatio);
  canvas.height = Math.round(height * devicePixelRatio);
  context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  buildHeart();
}

function drawFrame(now) {
  const elapsed = (now - cycleStartedAt) % cycleLength;
  const baseFontSize = Math.max(11, Math.min(19, width * .015));
  const fadeStart = cycleLength - 900;
  const sceneOpacity = elapsed > fadeStart ? 1 - (elapsed - fadeStart) / 900 : 1;
  const dissolve = clamp((elapsed - fadeStart) / 900, 0, 1);
  const heartBeat = elapsed > centerAt ? 1 + .026 * Math.max(0, Math.sin((elapsed - centerAt) * .006)) ** 7 : 1;
  const centerX = width / 2;
  const centerY = height / 2 - Math.min(18, height * .025);
  context.clearRect(0, 0, width, height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const star of stars) {
    context.globalAlpha = sceneOpacity * (.22 + .32 * (1 + Math.sin(now * .0014 + star.phase)) / 2);
    context.fillStyle = '#bae6fd';
    context.beginPath();
    context.arc(star.x + Math.sin(now * .00045 + star.phase) * 8, star.y + Math.cos(now * .00035 + star.phase) * 5, star.radius, 0, Math.PI * 2);
    context.fill();
  }

  for (const particle of particles) {
    const reveal = clamp((elapsed - particle.delay) / 520, 0, 1);
    if (reveal === 0) continue;
    const shimmer = reveal === 1 ? .78 + .22 * Math.sin(now * .004 + particle.flicker) : 1;
    const drift = Math.sin(now * .0025 + particle.flicker) * 1.5;
    const orbit = (1 - reveal) ** 2 * (30 + particle.size * 9);
    const positionX = centerX + (particle.x - centerX) * heartBeat + Math.cos(particle.angle + now * .003) * orbit;
    const positionY = centerY + (particle.y - centerY) * heartBeat + Math.sin(particle.angle + now * .003) * orbit + drift;
    context.globalAlpha = sceneOpacity * reveal * shimmer * (1 - dissolve);
    context.font = `700 ${baseFontSize * particle.size}px Arial, sans-serif`;
    context.shadowBlur = 16;
    context.shadowColor = particle.color;
    context.fillStyle = particle.color;
    context.fillText(particle.word, positionX, positionY);

    if (dissolve > 0) {
      const scatter = dissolve * (10 + particle.size * 12);
      context.globalAlpha = sceneOpacity * dissolve * shimmer;
      context.shadowBlur = 12;
      context.beginPath();
      context.arc(positionX + Math.cos(particle.flicker) * scatter, positionY + Math.sin(particle.flicker) * scatter, 1.2 + particle.size, 0, Math.PI * 2);
      context.fill();
    }
  }

  const centerReveal = clamp((elapsed - centerAt) / 700, 0, 1);
  if (centerReveal > 0) {
    const pulse = 1 + Math.sin(now * .004) * .025 + (heartBeat - 1) * .7;
    const waveProgress = clamp((elapsed - centerAt) / 1500, 0, 1);
    context.globalAlpha = sceneOpacity * (1 - waveProgress) * .62;
    context.strokeStyle = '#7dd3fc';
    context.lineWidth = 2.5 * (1 - waveProgress);
    context.shadowBlur = 22;
    context.shadowColor = '#38bdf8';
    context.beginPath();
    context.arc(centerX, centerY, 30 + waveProgress * Math.min(width, height) * .34, 0, Math.PI * 2);
    context.stroke();

    context.globalAlpha = sceneOpacity * centerReveal * (1 - dissolve);
    context.font = `700 ${Math.max(28, Math.min(56, width * .055)) * pulse}px Georgia, serif`;
    context.shadowBlur = 28;
    context.shadowColor = '#7dd3fc';
    context.fillStyle = '#fffaf5';
    context.fillText(centerText, centerX, centerY);
  }

  context.globalAlpha = 1;
  context.shadowBlur = 0;
  window.requestAnimationFrame(drawFrame);
}

async function startMusic() {
  try {
    await music.play();
    controls.hidden = true;
  } catch {
    controls.hidden = false;
  }
}

playButton.addEventListener('click', async () => {
  await startMusic();
  playButton.setAttribute('aria-pressed', String(!music.paused));
});

window.addEventListener('resize', resize);
resize();
void startMusic();
window.requestAnimationFrame(drawFrame);
