import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { GameEngine } from './gameEngine.js';
import { interpretUserMessage } from './llmService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = Number(process.env.PORT || 3000);

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});
const game = new GameEngine();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/state', (_req, res) => {
  res.json(game.getPublicState());
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

io.on('connection', (socket) => {
  socket.emit('state:update', game.getPublicState());

  socket.on('chat:message', async (text, callback) => {
    const message = String(text || '').trim().slice(0, 600);
    if (!message) return;

    game.addChatMessage('usuario', message);
    io.emit('state:update', game.getPublicState());

    try {
      const result = await interpretUserMessage(message);
      game.applyActions(result.acciones);
      game.addChatMessage('ia', result.respuesta_chat);
      io.emit('chat:reply', result);
      io.emit('state:update', game.getPublicState());
      if (typeof callback === 'function') callback({ ok: true, result });
    } catch (error) {
      const response = 'Hubo un problema interpretando el mensaje. Intenta pedir peces, plantas o comida de otra forma.';
      game.addChatMessage('ia', response);
      io.emit('chat:reply', { acciones: [], respuesta_chat: response });
      io.emit('state:update', game.getPublicState());
      if (typeof callback === 'function') callback({ ok: false, error: error.message });
    }
  });
});

game.on('update', (state) => {
  io.emit('state:update', state);
});

async function main() {
  await game.init();
  game.start();

  server.listen(PORT, () => {
    console.log(`Acuario virtual disponible en http://localhost:${PORT}`);
  });
}

process.on('SIGINT', async () => {
  console.log('Guardando estado antes de salir...');
  game.stop();
  await game.persist();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  game.stop();
  await game.persist();
  process.exit(0);
});

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
