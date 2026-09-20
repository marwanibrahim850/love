const canvas = document.querySelector('#heart');
const context = canvas.getContext('2d');
const music = document.querySelector('#music');
const playButton = document.querySelector('#playButton');
const controls = document.querySelector('#controls');

const words = ['love you', 'Love You', 'LOVE YOU'];
const colors = ['#4682b4', '#1e90ff', '#00bfff', '#6495ed', '#4169e1'];

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
  context.clearRect(0, 0, width, height);
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  for (const star of stars) {
    context.globalAlpha = sceneOpacity * (.22 + .32 * (1 + Math.sin(now * .0014 + star.phase)) / 2);
    context.fillStyle = '#bae6fd';
    context.beginPath();
    context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    context.fill();
  }

  for (const particle of particles) {
    const reveal = Math.max(0, Math.min(1, (elapsed - particle.delay) / 520));
    if (reveal === 0) continue;
    const shimmer = reveal === 1 ? .78 + .22 * Math.sin(now * .004 + particle.flicker) : 1;
    const drift = Math.sin(now * .0025 + particle.flicker) * 1.5;
    context.globalAlpha = sceneOpacity * reveal * shimmer;
    context.font = `700 ${baseFontSize * particle.size}px Arial, sans-serif`;
    context.shadowBlur = 16;
    context.shadowColor = particle.color;
    context.fillStyle = particle.color;
    context.fillText(particle.word, particle.x, particle.y + drift);
  }

  const centerReveal = Math.max(0, Math.min(1, (elapsed - centerAt) / 700));
  if (centerReveal > 0) {
    const pulse = 1 + Math.sin(now * .004) * .025;
    context.globalAlpha = sceneOpacity * centerReveal;
    context.font = `700 ${Math.max(28, Math.min(56, width * .055)) * pulse}px Georgia, serif`;
    context.shadowBlur = 28;
    context.shadowColor = '#7dd3fc';
    context.fillStyle = '#fffaf5';
    context.fillText('Love You', width / 2, height / 2 - Math.min(18, height * .025));
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
