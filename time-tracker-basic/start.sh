#!/bin/bash

# TaskFlow Pro - Server Startup Script
echo "🚀 Starting TaskFlow Pro with OpenAI Translation..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "📥 Please install Node.js from: https://nodejs.org/"
    echo ""
    exit 1
fi

# Show Node.js version
echo "✅ Node.js version: $(node --version)"
echo ""

# Make server.js executable
chmod +x server.js

# Start the server
echo "🌍 Starting server with OpenAI translator..."
node server.js
