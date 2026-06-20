const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDatabase = require('./database/connect');
const { validateEnv, env } = require('./config/env');
const { initSocket } = require('./socket');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const departmentRoutes = require('./routes/department.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const aiRoutes = require('./routes/ai.routes');
const recordsRoutes = require('./routes/records.routes');
const nurseRoutes = require('./routes/nurse.routes');
const adminRoutes = require('./routes/admin.routes');
const messageRoutes = require('./routes/message.routes');
const emergencyRoutes = require('./routes/emergency.routes');
const conversationRoutes = require('./routes/conversation.routes');
const reminderRoutes = require('./routes/reminder.routes');

async function bootstrap() {
  validateEnv();
  await connectDatabase();

  const app = express();
  const server = http.createServer(app);
  const allowedOrigins = [
    env.clientUrl,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'null'
  ].filter(Boolean);
  const corsOptions = {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked origin: ${origin}`));
    }
  };
  initSocket(server, allowedOrigins);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('dev'));
  app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'LifeCare Hospital API' }));
  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/departments', departmentRoutes);
  app.use('/api/appointments', appointmentRoutes);
  app.use('/api/ai', aiRoutes);
  app.use('/api/records', recordsRoutes);
  app.use('/api/nurse', nurseRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/messages', messageRoutes);
  app.use('/api/emergency', emergencyRoutes);
  app.use('/api/conversations', conversationRoutes);
  app.use('/api/reminders', reminderRoutes);

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ message: err.message || 'Server error' });
  });

  server.listen(env.port, () => console.log(`LifeCare Hospital API running on ${env.port}`));
}

bootstrap().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
