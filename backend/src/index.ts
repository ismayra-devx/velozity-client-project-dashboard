import http from 'http';
import { createApp } from './app.js';
import { config } from './config/index.js';
import { initSocketServer } from './lib/socket.js';
import { startOverdueTaskScheduler } from './jobs/overdueTaskScheduler.js';

const app = createApp();
const server = http.createServer(app);

// Initialize real-time WebSocket server
initSocketServer(server);

// Start background cron scheduler for overdue task evaluation
startOverdueTaskScheduler();

server.listen(config.port, () => {
  console.log(`[Server] Velozity Dashboard API running at http://localhost:${config.port}`);
  console.log(`[Server] Environment: ${config.nodeEnv}`);
});
