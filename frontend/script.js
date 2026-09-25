const socket = io();
const canvas = document.querySelector('#aquarium');
const ctx = canvas.getContext('2d');
const messagesEl = document.querySelector('#messages');
const form = document.querySelector('#chatForm');
const input = document.querySelector('#chatInput');
const fishCountEl = document.querySelector('#fishCount');
const invertebrateCountEl = document.querySelector('#invertebrateCount');
const plantCountEl = document.querySelector('#plantCount');
const algaeCountEl = document.querySelector('#algaeCount');
const woodCountEl = document.querySelector('#woodCount');
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
const phTextEl = document.querySelector('#phText');
const phaseTextEl = document.querySelector('#phaseText');
const filterLevelTextEl = document.querySelector('#filterLevelText');
const lightTextEl = document.querySelector('#lightText');
const waterAlertsEl = document.querySelector('#waterAlerts');
const ecosystemPanelEl = document.querySelector('.ecosystem-panel');
const ecosystemToggleEl = document.querySelector('#ecosystemToggle');
const soundToggleEl = document.querySelector('#soundToggle');
const soundVolumeEl = document.querySelector('#soundVolume');
const soundStatusEl = document.querySelector('#soundStatus');
const animalInspectorEl = document.querySelector('#animalInspector');
const inspectorCloseEl = document.querySelector('#inspectorClose');
const inspectorNameEl = document.querySelector('#inspectorName');
const inspectorSpeciesEl = document.querySelector('#inspectorSpecies');
const inspectorStatusEl = document.querySelector('#inspectorStatus');
const inspectorAgeEl = document.querySelector('#inspectorAge');
const inspectorHungerEl = document.querySelector('#inspectorHunger');
const inspectorHealthEl = document.querySelector('#inspectorHealth');
const inspectorStressEl = document.querySelector('#inspectorStress');
const inspectorSizeEl = document.querySelector('#inspectorSize');
const inspectorWarningEl = document.querySelector('#inspectorWarning');

let state = null;
let selectedAnimalKey = null;
let bubbles = Array.from({ length: 34 }, () => makeBubble());
let soundContext = null;
let soundGain = null;
let filterSoundEnabled = false;

socket.on('state:update', (newState) => {
  state = newState;
  renderStats();
  renderMessages();
  renderInspector();
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

input.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' || event.shiftKey) return;
  event.preventDefault();
  form.requestSubmit();
});

document.querySelectorAll('[data-speed]').forEach((button) => {
  button.addEventListener('click', () => {
    socket.emit('chat:message', `cambia el tiempo a ${button.dataset.speed.replace('_', ' ')}`);
  });
});

ecosystemToggleEl.addEventListener('click', () => {
  const isCollapsed = ecosystemPanelEl.classList.toggle('collapsed');
  ecosystemToggleEl.textContent = isCollapsed ? 'Mostrar panel' : 'Ocultar panel';
  ecosystemToggleEl.setAttribute('aria-expanded', String(!isCollapsed));
  localStorage.setItem('ecosystemPanelCollapsed', String(isCollapsed));
});

soundVolumeEl.value = localStorage.getItem('aquariumSoundVolume') || soundVolumeEl.value;
soundVolumeEl.addEventListener('input', () => {
  localStorage.setItem('aquariumSoundVolume', soundVolumeEl.value);
  if (soundGain) soundGain.gain.value = getSoundVolume();
});

soundToggleEl.addEventListener('click', () => {
  if (filterSoundEnabled) {
    soundContext.suspend();
    setFilterSoundEnabled(false);
    return;
  }
  startFilterSound();
});

canvas.addEventListener('click', (event) => {
  if (!state) return;
  const point = canvasEventToWorld(event);
  const animal = findAnimalAt(point.x, point.y);
  if (!animal) return;
  selectedAnimalKey = `${animal.kind}:${animal.id}`;
  renderInspector();
});

inspectorCloseEl.addEventListener('click', () => {
  selectedAnimalKey = null;
  renderInspector();
});

if (localStorage.getItem('ecosystemPanelCollapsed') === 'true') {
  ecosystemPanelEl.classList.add('collapsed');
  ecosystemToggleEl.textContent = 'Mostrar panel';
  ecosystemToggleEl.setAttribute('aria-expanded', 'false');
}

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
  algaeCountEl.textContent = state.algas.length;
  woodCountEl.textContent = state.maderas?.length || 0;
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
  filterLevelTextEl.textContent = `${Math.round(state.equipos.filtroNivel ?? 100)}%`;
  aerationTextEl.textContent = state.equipos.oxigenacionActiva ? 'activa' : 'apagada';
  phTextEl.textContent = Number(state.calidadAgua.ph ?? 7.2).toFixed(2);
  phaseTextEl.textContent = state.config?.fase || 'dia';
  lightTextEl.textContent = state.luzActiva ? 'encendida' : 'apagada';
  waterAlertsEl.innerHTML = state.alertas?.length
    ? state.alertas.map((alert) => `<span class="water-alert ${escapeHtml(alert.severidad)}">${escapeHtml(alert.texto)}</span>`).join('')
    : '<span class="water-ok">Sin alertas activas</span>';
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

function getSoundVolume() {
  return (Number(soundVolumeEl.value) / 100) * 0.045;
}

function setFilterSoundEnabled(enabled) {
  filterSoundEnabled = enabled;
  soundToggleEl.textContent = enabled ? 'Silenciar sonido' : 'Activar sonido';
  soundToggleEl.setAttribute('aria-pressed', String(enabled));
  soundStatusEl.textContent = enabled ? 'Filtro suave activo' : 'Filtro suave apagado';
}

async function startFilterSound() {
  if (!soundContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
      soundStatusEl.textContent = 'Este navegador no permite sonido ambiental.';
      return;
    }
    soundContext = new AudioContext();
    soundGain = soundContext.createGain();
    soundGain.gain.value = getSoundVolume();
    soundGain.connect(soundContext.destination);

    const noise = soundContext.createBufferSource();
    const buffer = soundContext.createBuffer(1, soundContext.sampleRate * 2, soundContext.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
    noise.buffer = buffer;
    noise.loop = true;

    const filter = soundContext.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850;
    filter.Q.value = 0.55;
    noise.connect(filter).connect(soundGain);
    noise.start();
  }

  await soundContext.resume();
  setFilterSoundEnabled(true);
}

function renderInspector() {
  const animal = getSelectedAnimal();
  if (!animal) {
    animalInspectorEl.classList.add('hidden');
    return;
  }

  animalInspectorEl.classList.remove('hidden');
  inspectorNameEl.textContent = animal.nombre || animal.tipo || animal.especie;
  inspectorSpeciesEl.textContent = animal.latin ? `${animal.latin} · ${animal.kind === 'pez' ? 'Pez' : animal.grupo} · ${animal.sexo || 'sexo no registrado'}` : animal.kind;
  inspectorStatusEl.textContent = getAnimalStatus(animal);
  inspectorAgeEl.textContent = formatAge(animal.edadEnHoras);
  inspectorHungerEl.textContent = `${Math.round(animal.hambre || 0)}%`;
  inspectorHealthEl.textContent = `${Math.round(animal.salud ?? 100)}%`;
  inspectorStressEl.textContent = `${Math.round(animal.estres ?? 0)}%`;
  inspectorSizeEl.textContent = `${Math.round((animal.escala || 1) * 100)}%`;

  const warning = getAnimalWarning(animal);
  inspectorWarningEl.textContent = warning;
  inspectorWarningEl.classList.toggle('hidden', !warning);
}

function getSelectedAnimal() {
  if (!state || !selectedAnimalKey) return null;
  const [kind, id] = selectedAnimalKey.split(':');
  const list = kind === 'pez' ? state.peces : state.invertebrados;
  const animal = list.find((item) => item.id === id);
  return animal ? { ...animal, kind } : null;
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
  drawWoods();
  drawPlants();
  drawAlgae();
  drawEggs();
  drawInvertebrates();
  drawFood();
  drawFish();
  drawSelectedAnimal();
  drawOverlay();
}

function drawSelectedAnimal() {
  const animal = getSelectedAnimal();
  if (!animal) return;
  const radius = getAnimalHitRadius(animal) + 8;
  ctx.save();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(animal.x, animal.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawWoods() {
  if (!state?.maderas) return;
  for (const wood of state.maderas) {
    ctx.save();
    ctx.translate(wood.x, wood.y);
    ctx.rotate(wood.rotacion || 0);
    ctx.scale(wood.escala || 1, wood.escala || 1);
    ctx.lineCap = 'round';

    ctx.strokeStyle = wood.accent || '#3f1f0f';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(-52, 8);
    ctx.quadraticCurveTo(-20, -20, 24, -6);
    ctx.quadraticCurveTo(48, 2, 68, -18);
    ctx.stroke();

    ctx.strokeStyle = wood.color || '#7c3f1d';
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(-50, 6);
    ctx.quadraticCurveTo(-18, -15, 24, -4);
    ctx.quadraticCurveTo(46, 0, 64, -16);
    ctx.stroke();

    ctx.strokeStyle = wood.accent || '#3f1f0f';
    ctx.lineWidth = 6;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-4 + i * 18, -5);
      ctx.lineTo(-22 + i * 20, -32 - i * 8);
      ctx.stroke();
    }
    ctx.restore();
  }
}

function drawEggs() {
  if (!state?.huevos?.length) return;
  for (const egg of state.huevos) {
    ctx.save();
    ctx.fillStyle = egg.color || '#fde68a';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(egg.x, egg.y, 4 + Math.sin(Date.now() / 280 + egg.x) * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
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
  drawSchoolLinks();
  for (const fish of state.peces) {
    ctx.save();
    ctx.translate(fish.x, fish.y);
    ctx.scale(fish.direccion || 1, 1);
    const size = 30 * fish.escala;

    if (!fish.vivo) {
      ctx.globalAlpha = 0.5;
      ctx.rotate(Math.PI);
    }

    if (fish.tipo === 'angel') {
      drawAngelFish(fish, size);
    } else if (fish.tipo === 'betta') {
      drawBettaFish(fish, size);
    } else if (fish.tipo === 'guppy') {
      drawGuppyFish(fish, size);
    } else if (fish.tipo === 'neon') {
      drawNeonFish(fish, size);
    } else if (['molly', 'platy'].includes(fish.tipo)) {
      drawLivebearerFish(fish, size);
    } else if (fish.tipo === 'xipho') {
      drawSwordtailFish(fish, size);
    } else if (['rasbora', 'tetra'].includes(fish.tipo)) {
      drawSchoolFish(fish, size);
    } else if (fish.tipo === 'ramirezi') {
      drawRamireziFish(fish, size);
    } else if (fish.tipo === 'gourami') {
      drawGouramiFish(fish, size);
    } else if (fish.tipo === 'ancistrus') {
      drawAncistrusFish(fish, size);
    } else if (['corydora', 'otocinclus'].includes(fish.tipo)) {
      drawBottomFish(fish, size);
    } else {
      drawGenericFish(fish, size);
    }

    drawHungerBar(fish, size);
    ctx.restore();
  }
}

function drawSchoolLinks() {
  const groups = ['neon', 'cebra', 'rasbora', 'tetra'];
  ctx.save();
  ctx.strokeStyle = 'rgba(186, 230, 253, 0.13)';
  ctx.lineWidth = 1;
  for (const type of groups) {
    const school = state.peces.filter((fish) => fish.vivo && fish.tipo === type);
    if (school.length < 4) continue;
    for (const fish of school) {
      const neighbor = school.find((candidate) => candidate.id !== fish.id && Math.hypot(candidate.x - fish.x, candidate.y - fish.y) < 95);
      if (!neighbor) continue;
      ctx.beginPath();
      ctx.moveTo(fish.x, fish.y);
      ctx.lineTo(neighbor.x, neighbor.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawGuppyFish(fish, size) {
  drawGenericFish(fish, size * 0.82);
  const wave = Math.sin(Date.now() / 180 + fish.x) * size * 0.12;
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.72, 0);
  ctx.lineTo(-size * 1.75, -size * 0.85 + wave);
  ctx.lineTo(-size * 1.65, size * 0.7 + wave);
  ctx.closePath();
  ctx.fill();
}

function drawNeonFish(fish, size) {
  drawGenericFish(fish, size * 0.72);
  ctx.strokeStyle = '#e0f2fe';
  ctx.lineWidth = Math.max(2, size * 0.12);
  ctx.beginPath();
  ctx.moveTo(-size * 0.45, -size * 0.18);
  ctx.lineTo(size * 0.5, -size * 0.18);
  ctx.stroke();
  ctx.strokeStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.1);
  ctx.lineTo(size * 0.5, size * 0.1);
  ctx.stroke();
}

function drawLivebearerFish(fish, size) {
  drawGenericFish(fish, size * 0.9);
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.15, -size * 0.42);
  ctx.lineTo(size * 0.15, -size * 0.95);
  ctx.lineTo(size * 0.42, -size * 0.35);
  ctx.closePath();
  ctx.fill();
}

function drawSwordtailFish(fish, size) {
  drawGenericFish(fish, size * 0.9);
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = Math.max(2, size * 0.1);
  ctx.beginPath();
  ctx.moveTo(-size * 1.1, 0);
  ctx.lineTo(-size * 2, -size * 0.7);
  ctx.moveTo(-size * 1.1, 0);
  ctx.lineTo(-size * 2, size * 0.7);
  ctx.stroke();
}

function drawSchoolFish(fish, size) {
  drawGenericFish(fish, size * 0.78);
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.3, -size * 0.4);
  ctx.lineTo(size * 0.12, -size * 0.88);
  ctx.lineTo(size * 0.35, -size * 0.32);
  ctx.closePath();
  ctx.fill();
  if (fish.tipo === 'tetra') {
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = Math.max(1.5, size * 0.08);
    ctx.beginPath();
    ctx.moveTo(-size * 0.35, size * 0.18);
    ctx.lineTo(size * 0.42, size * 0.18);
    ctx.stroke();
  }
}

function drawRamireziFish(fish, size) {
  drawGenericFish(fish, size * 0.92);
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.arc(size * 0.15, -size * 0.2, size * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-size * 0.35, -size * 0.38);
  ctx.lineTo(-size * 0.05, size * 0.35);
  ctx.stroke();
}

function drawGouramiFish(fish, size) {
  drawGenericFish(fish, size);
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.15, size * 0.25);
  ctx.lineTo(size * 0.2, size * 1.2);
  ctx.moveTo(size * 0.35, size * 0.25);
  ctx.lineTo(size * 0.55, size * 1.1);
  ctx.stroke();
}

function drawAncistrusFish(fish, size) {
  drawBottomFish(fish, size * 1.05);
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 1.5;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.moveTo(-size * 0.7, i * size * 0.12);
    ctx.lineTo(-size * 0.95, i * size * 0.12);
    ctx.stroke();
  }
}

function drawGenericFish(fish, size) {
  const wave = Math.sin(Date.now() / 220 + fish.x) * size * 0.08;
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size, size * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.82, 0);
  ctx.lineTo(-size * 1.42, -size * 0.42 + wave);
  ctx.lineTo(-size * 1.42, size * 0.42 + wave);
  ctx.closePath();
  ctx.fill();

  if (fish.tipo === 'cebra') {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-size * 0.55 + i * size * 0.25, -size * 0.38);
      ctx.lineTo(-size * 0.35 + i * size * 0.25, size * 0.36);
      ctx.stroke();
    }
  } else if (fish.tipo === 'xipho') {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 1.35, size * 0.22);
    ctx.lineTo(-size * 1.95, size * 0.55);
    ctx.stroke();
  } else {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.76)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-size * 0.25, 0);
    ctx.lineTo(size * 0.58, 0);
    ctx.stroke();
  }

  drawFishEye(size);
}

function drawBettaFish(fish, size) {
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.ellipse(-size * 0.85, 0, size * 0.75, size * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(-size * 0.05, size * 0.45, size * 0.55, size * 0.35, 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.95, size * 0.44, 0, 0, Math.PI * 2);
  ctx.fill();
  drawFishEye(size);
}

function drawAngelFish(fish, size) {
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.moveTo(size * 0.75, 0);
  ctx.lineTo(-size * 0.15, -size * 1.15);
  ctx.lineTo(-size * 0.75, 0);
  ctx.lineTo(-size * 0.15, size * 1.15);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.7, 0);
  ctx.lineTo(-size * 1.25, -size * 0.45);
  ctx.lineTo(-size * 1.25, size * 0.45);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(i * size * 0.22, -size * 0.72);
    ctx.lineTo(i * size * 0.08, size * 0.72);
    ctx.stroke();
  }
  drawFishEye(size);
}

function drawBottomFish(fish, size) {
  ctx.fillStyle = fish.color;
  ctx.beginPath();
  ctx.ellipse(0, size * 0.12, size * 0.95, size * 0.36, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = fish.accent;
  ctx.beginPath();
  ctx.moveTo(-size * 0.75, size * 0.1);
  ctx.lineTo(-size * 1.18, -size * 0.18);
  ctx.lineTo(-size * 1.18, size * 0.42);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = fish.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(size * 0.65, size * 0.18);
  ctx.lineTo(size * 1.15, size * 0.38);
  ctx.stroke();
  if (fish.tipo === 'corydora') {
    ctx.fillStyle = fish.accent;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.arc(i * size * 0.32, size * 0.1, size * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (fish.tipo === 'otocinclus') {
    ctx.strokeStyle = fish.accent;
    ctx.lineWidth = Math.max(2, size * 0.1);
    ctx.beginPath();
    ctx.moveTo(-size * 0.48, -size * 0.15);
    ctx.lineTo(size * 0.45, size * 0.22);
    ctx.stroke();
  }
  drawFishEye(size);
}

function drawFishEye(size) {
  ctx.fillStyle = '#02111f';
  ctx.beginPath();
  ctx.arc(size * 0.58, -size * 0.12, Math.max(2.4, size * 0.08), 0, Math.PI * 2);
  ctx.fill();
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
  if (!state || state.peces.length || state.invertebrados.length || state.plantas.length || state.algas.length || state.maderas?.length) return;
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

function canvasEventToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * 960,
    y: ((event.clientY - rect.top) / rect.height) * 620
  };
}

function findAnimalAt(x, y) {
  const animals = [
    ...state.peces.map((animal) => ({ ...animal, kind: 'pez' })),
    ...state.invertebrados.map((animal) => ({ ...animal, kind: 'invertebrado' }))
  ];

  for (let i = animals.length - 1; i >= 0; i -= 1) {
    const animal = animals[i];
    const radius = getAnimalHitRadius(animal);
    if (Math.hypot(animal.x - x, animal.y - y) <= radius) return animal;
  }

  return null;
}

function getAnimalHitRadius(animal) {
  const base = animal.kind === 'pez' ? 34 : 24;
  return base * (animal.escala || 1) + 12;
}

function getAnimalStatus(animal) {
  if (!animal.vivo) return 'muerto';
  if ((animal.horasEnHambruna || 0) > 0) return `en hambruna (${Math.round(animal.horasEnHambruna)} h)`;
  if ((animal.hambre || 0) >= 75) return 'hambriento';
  if (canGrazeNaturally(animal)) return 'vivo, puede alimentarse del ecosistema';
  return 'vivo';
}

function getAnimalWarning(animal) {
  if (!animal.vivo) return 'Retiralo con "limpia los muertos" para proteger la calidad del agua.';
  const fishTypes = state.peces.filter((fish) => fish.vivo).map((fish) => fish.tipo);
  const hasBetta = fishTypes.includes('betta');
  const hasAngel = fishTypes.includes('angel');
  const smallPrey = ['neon', 'tetra', 'rasbora', 'cherry', 'fantasma'];

  if (animal.tipo === 'betta' && fishTypes.includes('guppy')) return 'Riesgo: betta y guppy pueden tener conflictos por aletas llamativas.';
  if (animal.tipo === 'guppy' && hasBetta) return 'Riesgo: guppy con betta puede generar agresion.';
  if (animal.tipo === 'angel' && state.peces.some((fish) => fish.vivo && ['neon', 'tetra', 'rasbora'].includes(fish.tipo))) return 'Riesgo: el pez angel adulto puede depredar peces pequenos de cardumen.';
  if (animal.kind === 'pez' && smallPrey.includes(animal.tipo) && hasAngel) return 'Riesgo: puede ser presa del pez angel adulto.';
  if (animal.grupo === 'gamba' && ['cherry', 'fantasma'].includes(animal.especie) && (hasBetta || hasAngel)) return 'Riesgo: esta gamba puede ser cazada por betta o pez angel.';
  if (animal.tipo === 'gourami' && fishTypes.some((type) => ['betta', 'ramirezi'].includes(type))) return 'Riesgo territorial: gourami, betta y ramirezi pueden competir.';
  if (animal.tipo === 'ramirezi' && fishTypes.some((type) => ['betta', 'gourami', 'angel'].includes(type))) return 'Riesgo territorial: ramirezi necesita un entorno tranquilo.';
  return '';
}

function canGrazeNaturally(animal) {
  if (['otocinclus', 'ancistrus', 'molly', 'platy', 'xipho', 'corydora', 'guppy'].includes(animal.tipo)) return true;
  return ['caracol', 'gamba'].includes(animal.grupo);
}

function formatAge(hours) {
  const value = Number(hours || 0);
  if (value < 24) return `${Math.floor(value)} h`;
  return `${Math.floor(value / 24)} d ${Math.floor(value % 24)} h`;
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
