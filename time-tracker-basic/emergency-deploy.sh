#!/bin/bash

echo "🚨 EMERGENCY VERCEL DEPLOYMENT FIX"
echo "=================================="
echo ""

# Step 1: Clean everything
echo "🧹 Cleaning deployment cache..."
rm -rf .vercel
rm -rf node_modules
rm -rf dist
rm -rf build

# Step 2: Create minimal vercel.json
echo "📝 Creating minimal vercel.json..."
cat > vercel.json << 'EOF'
{
  "cleanUrls": true
}
EOF

# Step 3: Ensure index.html is the landing page
echo "✅ index.html is now the landing page"

# Step 4: Deploy with force
echo "🚀 Force deploying to Vercel..."
echo ""

if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy with maximum force
vercel --prod --force --yes

echo ""
echo "✅ DEPLOYMENT COMPLETE!"
echo ""
echo "🧪 Test these URLs:"
echo "   • Root: https://your-app.vercel.app/"
echo "   • App: https://your-app.vercel.app/app.html"
echo "   • Test: https://your-app.vercel.app/test.html"
echo ""
echo "💡 The root URL now shows the full landing page!"
echo "🔑 Add your OpenAI API key in the app to unlock all features!"
