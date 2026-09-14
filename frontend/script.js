const socket = io();
const canvas = document.querySelector('#aquarium');
const ctx = canvas.getContext('2d');
const messagesEl = document.querySelector('#messages');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const fishCountEl = document.querySelector('#fishCount');
const invertebrateCountEl = document.querySelector('#invertebrateCount');
const plantCountEl = document.querySelector('#plantCount');
const nutrientsEl = document.querySelector('#nutrients');
const gameHoursEl = document.querySelector('#gameHours');
const timeSpeedEl = document.querySelector('#timeSpeed');
const waterHealthEl = document.querySelector('#waterHealth');
const waterHealthTextEl = document.querySelector('#waterHealthText');
const ammoniaTextEl = document.querySelector('#ammoniaText');
const nitriteTextEl = document.querySelector('#nitriteText');
const nitrateTextEl = document.querySelector('#nitrateText');
const oxygenTextEl = document.querySelector('#oxygenText');
const filterTextEl = document.querySelector('#filterText');
const aerationTextEl = document.querySelector('#aerationText');

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

document.querySelectorAll('[data-speed]').forEach((button) => {
  button.addEventListener('click', () => {
    socket.emit('chat:message', `cambia el tiempo a ${button.dataset.speed.replace('_', ' ')}`);
  });
});

function setFormBusy(isBusy) {
  form.querySelector('button').disabled = isBusy;
}

function renderStats() {
  if (!state) return;
  const aliveFish = state.peces.filter((fish) => fish.vivo).length;
  const aliveInvertebrates = state.invertebrados.filter((animal) => animal.vivo).length;
  fishCountEl.textContent = `${aliveFish}/${state.peces.length}`;
  invertebrateCountEl.textContent = `${aliveInvertebrates}/${state.invertebrados.length}`;
  plantCountEl.textContent = state.plantas.length;
  nutrientsEl.textContent = Math.round(state.nutrientes);
  gameHoursEl.textContent = Math.floor(state.horasJuego);
  timeSpeedEl.textContent = state.velocidadTiempo;
  document.querySelectorAll('[data-speed]').forEach((button) => {
    button.classList.toggle('active', button.dataset.speed === state.velocidadTiempo);
  });

  const water = state.calidadAgua;
  waterHealthEl.value = water.salud;
  waterHealthTextEl.textContent = `${Math.round(water.salud)}%`;
  ammoniaTextEl.textContent = `${Math.round(water.amonio)}%`;
  nitriteTextEl.textContent = `${Math.round(water.nitritos)}%`;
  nitrateTextEl.textContent = `${Math.round(water.nitratos)}%`;
  oxygenTextEl.textContent = `${Math.round(water.oxigeno)}%`;
  filterTextEl.textContent = state.equipos.filtroActivo ? 'activo' : 'apagado';
  aerationTextEl.textContent = state.equipos.oxigenacionActiva ? 'activa' : 'apagada';
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
  drawAlgae();
  drawInvertebrates();
  drawFood();
  drawFish();
  drawOverlay();
}

function drawAlgae() {
  if (!state) return;
  for (const algae of state.algas) {
    const sway = Math.sin(Date.now() / 700 + algae.x) * 3;
    ctx.strokeStyle = algae.color;
    ctx.lineWidth = algae.especie === 'filamentosa' ? 2 : 5;
    ctx.lineCap = 'round';
    const strands = algae.especie === 'filamentosa' ? 8 : 5;
    for (let i = 0; i < strands; i += 1) {
      const offset = (i - strands / 2) * 5;
      ctx.beginPath();
      ctx.moveTo(algae.x + offset, algae.y);
      ctx.quadraticCurveTo(algae.x + offset + sway, algae.y - algae.tamano * 0.5, algae.x + offset * 0.4 + sway, algae.y - algae.tamano);
      ctx.stroke();
    }
  }
}

function drawInvertebrates() {
  if (!state) return;
  for (const animal of state.invertebrados) {
    ctx.save();
    ctx.translate(animal.x, animal.y);
    ctx.scale(animal.direccion || 1, 1);
    const size = 18 * animal.escala;

    if (!animal.vivo) {
      ctx.globalAlpha = 0.45;
      ctx.rotate(Math.PI);
    }

    if (animal.grupo === 'caracol') {
      drawSnail(animal, size);
    } else {
      drawShrimp(animal, size);
    }

    drawHungerBar(animal, size * 0.9);
    ctx.restore();
  }
}

function drawSnail(animal, size) {
  ctx.fillStyle = animal.accent;
  ctx.beginPath();
  ctx.ellipse(size * 0.35, size * 0.35, size * 0.8, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = animal.color;
  ctx.beginPath();
  ctx.arc(-size * 0.15, 0, size * 0.72, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(2, 6, 23, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(-size * 0.15, 0, size * 0.45, 0, Math.PI * 1.65);
  ctx.stroke();

  ctx.strokeStyle = animal.accent;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(size * 0.75, size * 0.1);
  ctx.lineTo(size * 1.18, -size * 0.45);
  ctx.moveTo(size * 0.85, size * 0.16);
  ctx.lineTo(size * 1.3, -size * 0.25);
  ctx.stroke();
}

function drawShrimp(animal, size) {
  ctx.strokeStyle = animal.accent;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.2 + i * size * 0.18, size * 0.4);
    ctx.lineTo(-size * 0.36 + i * size * 0.18, size * 0.9);
    ctx.stroke();
  }

  ctx.fillStyle = animal.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 1.05, size * 0.48, -0.18, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = animal.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.85, -size * 0.03);
  ctx.lineTo(-size * 1.35, -size * 0.42);
  ctx.lineTo(-size * 1.2, size * 0.28);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#02111f';
  ctx.beginPath();
  ctx.arc(size * 0.64, -size * 0.18, Math.max(2, size * 0.1), 0, Math.PI * 2);
  ctx.fill();
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
  if (!state || state.peces.length || state.invertebrados.length || state.plantas.length) return;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.38)';
  ctx.fillRect(0, 0, 960, 620);
  ctx.fillStyle = '#e0f2fe';
  ctx.font = '700 34px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText('Tu acuario esta vacio', 480, 280);
  ctx.font = '500 18px system-ui';
  ctx.fillStyle = '#bae6fd';
  ctx.fillText('Usa el chat para agregar peces, caracoles, gambas y plantas de agua dulce.', 480, 318);
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
