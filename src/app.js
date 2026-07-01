const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

// Import routes
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use('/api/auth', limiter);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging middleware for debugging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.url}`);
  next();
});

// ========== STATIC FILE SERVING ==========
// This serves all files from the public directory
// /js/dashboard.js -> /public/js/dashboard.js
// /css/style.css -> /public/css/style.css
app.use(express.static(path.join(__dirname, '../public')));

// Also handle /public/ paths (for backward compatibility)
app.use('/public', express.static(path.join(__dirname, '../public')));
// ========================================

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/u', publicRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Certil.ink API is running',
    timestamp: new Date().toISOString()
  });
});

// Serve HTML pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile.html'));
});

app.get('/public-profile.html', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/public-profile.html'));
});

// Handle public profile routes with clean URLs
app.get('/public/:username', (req, res) => {
  const { username } = req.params;
  // Send the HTML file with the username as a query parameter
  // This way the JavaScript can easily read it
  res.sendFile(path.join(__dirname, '../public/public-profile.html'));
});

// Also handle direct username routes
app.get('/:username', (req, res, next) => {
  const { username } = req.params;
  
  // Skip static files and API routes
  if (username.includes('.') || 
      username === 'index.html' || 
      username === 'dashboard.html' || 
      username === 'profile.html' || 
      username === 'public-profile.html' ||
      username === 'favicon.ico' ||
      username === 'js' ||
      username === 'css' ||
      username === 'public' ||
      username === 'api') {
      return next();
  }
  
  // Redirect to /public/:username for consistency
  res.redirect(`/public/${username}`);
});

// Error handling middleware
app.use(errorHandler);

// 404 handler - IMPORTANT: Don't return HTML for JS requests
app.use((req, res) => {
  // If it's an API request, return JSON
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: 'API route not found'
    });
  }
  
  // If it's a JS or CSS file that's missing, return proper 404
  if (req.path.match(/\.(js|css|json|png|jpg|jpeg|gif|svg)$/)) {
    return res.status(404).type('text/plain').send('File not found');
  }
  
  // For HTML requests, serve the appropriate page
  if (req.accepts('html')) {
    return res.status(404).sendFile(path.join(__dirname, '../public/index.html'));
  }
  
  // Otherwise return JSON
  res.status(404).json({
    success: false,
    message: 'Not found'
  });
});

module.exports = app;