#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon'
};

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || 'localhost';

// Create HTTP server
const server = http.createServer((req, res) => {
  // Parse URL
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;

  // Default to landing page for root path
  if (pathname === '/') {
    pathname = '/landing.html';
  }

  // Security: prevent directory traversal
  const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, safePath);

  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // File not found
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
            a { color: #3498db; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>404 - File Not Found</h1>
          <p>The requested file <code>${pathname}</code> was not found.</p>
          <p><a href="/app.html">← Go to TaskFlow App</a></p>
        </body>
        </html>
      `);
      return;
    }

    // Get file extension and MIME type
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = mimeTypes[ext] || 'application/octet-stream';

    // Read and serve file
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/html' });
        res.end(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>500 - Server Error</title>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              h1 { color: #e74c3c; }
            </style>
          </head>
          <body>
            <h1>500 - Internal Server Error</h1>
            <p>Error reading file: ${err.message}</p>
          </body>
          </html>
        `);
        return;
      }

      // Set appropriate headers
      res.writeHead(200, { 
        'Content-Type': mimeType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(data);
    });
  });
});

// Start server
server.listen(PORT, HOST, () => {
  console.log('🚀 TaskFlow Pro Server Started!');
  console.log('');
  console.log('📱 Your app is running at:');
  console.log(`   http://${HOST}:${PORT}`);
  console.log(`   http://localhost:${PORT}`);
  console.log('');
  console.log('🌍 OpenAI Translator Features:');
  console.log('   ✅ 20 languages supported');
  console.log('   ✅ Beautiful translation UI');
  console.log('   ✅ Smart error handling');
  console.log('   ✅ Professional AI translation');
  console.log('');
  console.log('🔧 Setup Instructions:');
  console.log('   1. Open the app in your browser');
  console.log('   2. Go to Settings → OpenAI');
  console.log('   3. Add your OpenAI API key');
  console.log('   4. Create tasks and translate them!');
  console.log('');
  console.log('📖 Documentation:');
  console.log('   • TRANSLATION-SETUP.md - Complete guide');
  console.log('   • OPENAI-INTEGRATION-STATUS.md - Technical details');
  console.log('');
  console.log('Press Ctrl+C to stop the server');
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down TaskFlow server...');
  server.close(() => {
    console.log('✅ Server stopped successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
