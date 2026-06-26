require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const pool = require('./db');
const swaggerSpec = require('./src/config/swagger');
const { initWebSocket } = require('./src/utils/websocket');

const authRoutes = require('./src/routes/authRoutes');
const userRoutes = require('./src/routes/userRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const attachmentRoutes = require('./src/routes/attachmentRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const projectRoutes = require('./src/routes/projectRoutes');

const app = express();
const PORT = process.env.PORT || 5000;
const isTest = process.env.NODE_ENV === 'test';

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { errorCode: 'RATE_LIMIT', message: 'Too many requests, please try again later' },
});
app.use('/api/', apiLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { errorCode: 'RATE_LIMIT', message: 'Too many login attempts' },
});
app.use('/api/auth/login', authLimiter);

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW() AS time');
    return res.status(200).json({
      status: 'Server running',
      database: 'Connected',
    });
  } catch (error) {
    return res.status(500).json({
      status: 'Server running',
      database: 'Disconnected',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api', attachmentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/projects', projectRoutes);

app.use((req, res) => {
  res.status(404).json({ errorCode: 'NOT_FOUND', message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.message === 'File type not allowed') {
    return res.status(400).json({ errorCode: 'INVALID_FILE_TYPE', message: err.message });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ errorCode: 'FILE_TOO_LARGE', message: 'File exceeds 10MB limit' });
  }

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ errorCode: 'CORS_FORBIDDEN', message: err.message });
  }

  return res.status(500).json({
    errorCode: 'SERVER_ERROR',
    message: 'An unexpected error occurred',
    description: process.env.NODE_ENV === 'production' ? undefined : err.message,
  });
});

function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
  });

  if (!isTest) {
    initWebSocket(server);
  }

  return server;
}

if (require.main === module) {
  startServer();
}

module.exports = app;
module.exports.startServer = startServer;
