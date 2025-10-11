#!/bin/bash

# TaskFlow Pro - Vercel Deployment Script
echo "🚀 Deploying TaskFlow Pro to Vercel..."
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
    echo ""
fi

# Show current directory
echo "📁 Current directory: $(pwd)"
echo ""

# Check for required files
echo "🔍 Checking required files..."
files=("vercel.json" "index.html" "landing.html" "app.html" "styles.css" "api-integrations.js")
missing_files=()

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ $file (missing)"
        missing_files+=("$file")
    fi
done

if [ ${#missing_files[@]} -ne 0 ]; then
    echo ""
    echo "❌ Missing required files. Please ensure all files are present."
    exit 1
fi

echo ""
echo "🎯 All required files found!"
echo ""

# Deploy to Vercel
echo "🚀 Starting Vercel deployment..."
echo ""

# Deploy with production flag
vercel --prod

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Your TaskFlow Pro app should now be live!"
echo "📋 Features available:"
echo "   • 🌍 OpenAI Translation (20+ languages)"
echo "   • 👁️ OpenAI Vision OCR"
echo "   • 🤖 AI Task Enhancement"
echo "   • 📊 Smart Task Analysis"
echo "   • 📅 AI Calendar Generation"
echo ""
echo "🔑 Don't forget to add your OpenAI API key in Settings!"
echo ""
echo "🎉 Happy task managing!"
