import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import {
  handleDiscordTest,
  handleDiscordSend,
  handleEnvConfig,
} from './server/discordApi.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// API routes
app.get('/api/discord/env-config', handleEnvConfig);
app.post('/api/discord/test', handleDiscordTest);
app.post('/api/discord/send', handleDiscordSend);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'Discord Raid Bot Server' });
});

// Serve static assets from dist in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Discord Raid Bot server running on http://0.0.0.0:${PORT}`);
});
