const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss;
let keepAliveInterval;

// Map of userId -> WebSocket connection
const clients = new Map();

const initWebSocket = (server) => {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    // Extract token from URL: ws://host/ws?token=xxx
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(1008, 'Token required');
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      clients.set(userId, ws);
      console.log(`WS: User ${userId} connected`);

      ws.on('close', () => {
        clients.delete(userId);
        console.log(`WS: User ${userId} disconnected`);
      });

      ws.on('error', (err) => {
        console.error('WS error:', err.message);
        clients.delete(userId);
      });

      // Ping/pong to keep alive
      ws.isAlive = true;
      ws.on('pong', () => { ws.isAlive = true; });

    } catch (err) {
      ws.close(1008, 'Invalid token');
    }
  });

  // Keep-alive interval
  keepAliveInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  console.log('✅ WebSocket server initialized');
};

// Send notification to a specific user
const notifyUser = (userId, payload) => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
};

// Broadcast to all connected users
const broadcast = (payload) => {
  clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  });
};

const cleanupWebSocket = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
  }
  if (wss) {
    wss.close();
  }
  clients.clear();
};

module.exports = { initWebSocket, notifyUser, broadcast, cleanupWebSocket };
