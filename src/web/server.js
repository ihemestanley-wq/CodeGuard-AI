/**
 * CodeGuard AI Web Server
 * Express server for the web UI and API endpoints
 */

const express = require('express');
const path = require('path');
const config = require('./config');
const { applySecurityMiddleware } = require('./middleware/security');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/analyze');
const logger = require('../observability/logger');

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply security middleware (helmet, CORS, rate limiting)
applySecurityMiddleware(app);

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Serve static files from public directory (vanilla JS UI)
app.use(express.static(path.join(__dirname, 'public')));

// Serve React app build files at /react route
app.use('/react', express.static(path.join(__dirname, '../../frontend/dist')));

// Serve examples directory for sample diffs
app.use('/examples', express.static(path.join(__dirname, '../../examples')));

// API routes
app.use('/api', apiRoutes);

// Root route - serve vanilla JS UI index.html
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, 'public', 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({
        success: true,
        message: 'CodeGuard AI Web Server',
        version: require('../../package.json').version,
        endpoints: {
          analyze: 'POST /api/analyze',
          health: 'GET /api/health',
        },
        ui: {
          vanilla: 'http://localhost:3000/',
          react: 'http://localhost:3000/react',
        },
      });
    }
  });
});

// React app route - serve React UI
app.get('/react', (req, res) => {
  const reactIndexPath = path.join(__dirname, '../../frontend/dist', 'index.html');
  res.sendFile(reactIndexPath, (err) => {
    if (err) {
      res.status(404).json({
        success: false,
        message: 'React UI not built yet. Run "npm run build:frontend" first.',
        error: err.message,
      });
    }
  });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = config.server.port;
const HOST = config.server.host;

const server = app.listen(PORT, HOST, () => {
  logger.info('CodeGuard AI Web Server started', {
    port: PORT,
    host: HOST,
    environment: config.server.env,
    nodeVersion: process.version,
  });
  console.log(`\n🚀 CodeGuard AI Web Server running at http://${HOST}:${PORT}`);
  console.log('\n🎨 User Interfaces:');
  console.log(`   Vanilla JS UI: http://${HOST}:${PORT}/`);
  console.log(`   React UI:      http://${HOST}:${PORT}/react`);
  console.log('\n📊 API Endpoints:');
  console.log(`   POST http://${HOST}:${PORT}/api/analyze - Analyze PR diff`);
  console.log(`   GET  http://${HOST}:${PORT}/api/health - Health check`);
  console.log('\n✨ Ready to analyze code!\n');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', {
    error: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection:', {
    reason,
    promise,
  });
});

module.exports = app;

// Made with Bob
