const socket = io();
const canvas = document.querySelector('#aquarium');
const ctx = canvas.getContext('2d');
const messagesEl = document.querySelector('#messages');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const fishCountEl = document.querySelector('#fishCount');
const plantCountEl = document.querySelector('#plantCount');
const nutrientsEl = document.querySelector('#nutrients');
const gameHoursEl = document.querySelector('#gameHours');

let state = null;
let bubbles = Array.from({ length: 34 }, () => makeBubble());

socket.on('state:update', (newState) => {
  state = newState;
  renderStats();
  renderMessages();
});

socket.on('connect_error', () => {
  addTransientSystemMessage('No se pudo conectar con el servidor.');
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  setFormBusy(true);
  socket.emit('chat:message', text, () => setFormBusy(false));
  setTimeout(() => setFormBusy(false), 12000);
});

function setFormBusy(isBusy) {
  form.querySelector('button').disabled = isBusy;
}

function renderStats() {
  if (!state) return;
  const aliveFish = state.peces.filter((fish) => fish.vivo).length;
  fishCountEl.textContent = `${aliveFish}/${state.peces.length}`;
  plantCountEl.textContent = state.plantas.length;
  nutrientsEl.textContent = Math.round(state.nutrientes);
  gameHoursEl.textContent = Math.floor(state.horasJuego);
}

function renderMessages() {
  if (!state) return;
  const shouldStickToBottom = messagesEl.scrollTop + messagesEl.clientHeight >= messagesEl.scrollHeight - 24;
  messagesEl.innerHTML = state.mensajes.map((message) => `
    <article class="message ${escapeHtml(message.autor)}">
      <small>${escapeHtml(message.autor)}</small>
      ${escapeHtml(message.texto)}
    </article>
  `).join('');
  if (shouldStickToBottom) messagesEl.scrollTop = messagesEl.scrollHeight;
}

function addTransientSystemMessage(text) {
  const node = document.createElement('article');
  node.className = 'message sistema';
  node.innerHTML = `<small>sistema</small>${escapeHtml(text)}`;
  messagesEl.appendChild(node);
}

function animate() {
  resizeCanvasToDisplaySize();
  drawAquarium();
  requestAnimationFrame(animate);
}

function resizeCanvasToDisplaySize() {
  const rect = canvas.getBoundingClientRect();
  const width = Math.round(rect.width * window.devicePixelRatio);
  const height = Math.round(rect.height * window.devicePixelRatio);
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  ctx.setTransform(canvas.width / 960, 0, 0, canvas.height / 620, 0, 0);
}

function drawAquarium() {
  drawWater();
  drawBubbles();
  drawPlants();
  drawFood();
  drawFish();
  drawOverlay();
}

function drawWater() {
  const gradient = ctx.createLinearGradient(0, 0, 0, 620);
  gradient.addColorStop(0, '#075985');
  gradient.addColorStop(0.45, '#0369a1');
  gradient.addColorStop(1, '#082f49');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 960, 620);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  for (let i = 0; i < 9; i += 1) {
    const y = 48 + i * 42 + Math.sin(Date.now() / 900 + i) * 6;
    ctx.beginPath();
    ctx.ellipse(480, y, 500, 12, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  const sand = ctx.createLinearGradient(0, 540, 0, 620);
  sand.addColorStop(0, '#c0843f');
  sand.addColorStop(1, '#7c4a20');
  ctx.fillStyle = sand;
  ctx.beginPath();
  ctx.moveTo(0, 552);
  for (let x = 0; x <= 960; x += 40) {
    ctx.lineTo(x, 552 + Math.sin(x / 44) * 9);
  }
  ctx.lineTo(960, 620);
  ctx.lineTo(0, 620);
  ctx.closePath();
  ctx.fill();
}

function drawBubbles() {
  ctx.strokeStyle = 'rgba(219, 245, 255, 0.45)';
  bubbles.forEach((bubble) => {
    bubble.y -= bubble.speed;
    bubble.x += Math.sin(Date.now() / 600 + bubble.phase) * 0.22;
    if (bubble.y < -20) Object.assign(bubble, makeBubble(630));

    ctx.beginPath();
    ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
    ctx.stroke();
  });
}

function drawPlants() {
  if (!state) return;
  for (const plant of state.plantas) {
    const sway = Math.sin(Date.now() / 900 + plant.x) * 5;
    ctx.strokeStyle = plant.color;
    ctx.lineWidth = plant.especie === 'ambulia' ? 3 : 7;
    ctx.lineCap = 'round';

    const stems = plant.especie === 'ambulia' ? 6 : 4;
    for (let i = 0; i < stems; i += 1) {
      const offset = (i - stems / 2) * 7;
      ctx.beginPath();
      ctx.moveTo(plant.x + offset, plant.y);
      ctx.quadraticCurveTo(
        plant.x + offset + sway,
        plant.y - plant.altura * 0.52,
        plant.x + offset * 0.5 + sway * 1.6,
        plant.y - plant.altura
      );
      ctx.stroke();
    }

    if (plant.especie === 'anubia') {
      ctx.fillStyle = '#166534';
      for (let i = 0; i < 5; i += 1) {
        ctx.beginPath();
        ctx.ellipse(plant.x + (i - 2) * 10 + sway, plant.y - plant.altura + i * 7, 12, 7, -0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawFood() {
  if (!state) return;
  ctx.fillStyle = '#facc15';
  for (const food of state.comida) {
    ctx.beginPath();
    ctx.arc(food.x, food.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFish() {
  if (!state) return;
  for (const fish of state.peces) {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.scale(fish.direccion || 1, 1);
    const size = 30 * fish.escala;

    if (!fish.vivo) {
      ctx.globalAlpha = 0.5;
      ctx.rotate(Math.PI);
    }

    ctx.fillStyle = fish.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, size, size * 0.48, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = fish.accent;
    ctx.beginPath();
    ctx.moveTo(-size * 0.82, 0);
    ctx.lineTo(-size * 1.42, -size * 0.42);
    ctx.lineTo(-size * 1.42, size * 0.42);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.76)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, 0);
    ctx.lineTo(size * 0.58, 0);
    ctx.stroke();

    ctx.fillStyle = '#02111f';
    ctx.beginPath();
    ctx.arc(size * 0.58, -size * 0.12, Math.max(2.4, size * 0.08), 0, Math.PI * 2);
    ctx.fill();

    drawHungerBar(fish, size);
    ctx.restore();
  }
}

function drawHungerBar(fish, size) {
  ctx.save();
  ctx.scale(fish.direccion || 1, 1);
  const width = size * 1.8;
  const x = -width / 2;
  const y = -size * 1.05;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.45)';
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = fish.hambre > 70 ? '#fb7185' : '#34d399';
  ctx.fillRect(x, y, width * (fish.hambre / 100), 5);
  ctx.restore();
}

function drawOverlay() {
  if (!state || state.peces.length || state.plantas.length) return;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.38)';
  ctx.fillRect(0, 0, 960, 620);
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '700 34px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Tu acuario esta vacio', 480, 280);
  ctx.font = '500 18px system-ui';
  ctx.fillStyle = '#bae6fd';
  ctx.fillText('Usa el chat para agregar peces neon, guppy, anubias o ambulias.', 480, 318);
}

function makeBubble(startY = Math.random() * 620) {
  return {
    x: Math.random() * 960,
    y: startY,
    r: 2 + Math.random() * 7,
    speed: 0.25 + Math.random() * 1.1,
    phase: Math.random() * 10
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

animate();
