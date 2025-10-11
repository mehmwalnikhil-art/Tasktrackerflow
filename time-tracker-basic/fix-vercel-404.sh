#!/bin/bash

# TaskFlow Pro - Fix Vercel 404 Error Script
echo "🔧 Fixing Vercel 404 Error for TaskFlow Pro..."
echo ""

# Step 1: Check current deployment status
echo "📊 Step 1: Checking deployment status..."
if command -v vercel &> /dev/null; then
    echo "✅ Vercel CLI found"
    vercel ls
else
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi
echo ""

# Step 2: Validate configuration files
echo "📋 Step 2: Validating configuration files..."

# Check vercel.json
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json exists"
    echo "📄 Content preview:"
    head -10 vercel.json
else
    echo "❌ vercel.json missing!"
    exit 1
fi
echo ""

# Check critical HTML files
files=("landing.html" "app.html" "index.html")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing!"
        exit 1
    fi
done
echo ""

# Step 3: Clean previous deployment
echo "🧹 Step 3: Cleaning previous deployment..."
rm -rf .vercel 2>/dev/null || true
echo "✅ Cleaned .vercel directory"
echo ""

# Step 4: Force redeploy
echo "🚀 Step 4: Force redeploying to Vercel..."
echo "This will create a fresh deployment with the new configuration..."
echo ""

# Deploy with force flag
vercel --prod --force

echo ""
echo "✅ Deployment complete!"
echo ""

# Step 5: Test the deployment
echo "🧪 Step 5: Getting deployment URL..."
DEPLOYMENT_URL=$(vercel ls | grep -E 'https://.*\.vercel\.app' | head -1 | awk '{print $2}')

if [ -n "$DEPLOYMENT_URL" ]; then
    echo "🌐 Your app is deployed at: $DEPLOYMENT_URL"
    echo ""
    echo "🧪 Testing URLs:"
    echo "   • Root: $DEPLOYMENT_URL"
    echo "   • App: $DEPLOYMENT_URL/app"
    echo "   • Clear Data: $DEPLOYMENT_URL/clear-demo-data"
    echo ""
    echo "📱 Test these URLs in your browser!"
else
    echo "⚠️ Could not determine deployment URL. Check Vercel dashboard."
fi

echo ""
echo "🎯 If you still see 404 errors:"
echo "   1. Wait 1-2 minutes for propagation"
echo "   2. Try hard refresh (Ctrl+F5 or Cmd+Shift+R)"
echo "   3. Check Vercel dashboard for deployment logs"
echo "   4. Ensure you're using the correct URL"
echo ""
echo "🔑 Don't forget to add your OpenAI API key in Settings!"
echo ""
echo "✨ Your TaskFlow Pro should now be working on Vercel!"
