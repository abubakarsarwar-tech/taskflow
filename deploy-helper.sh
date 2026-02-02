#!/bin/bash

# TaskFlow Quick Deployment Script
# This script makes it easy to deploy your changes to Hostinger

echo "🚀 TaskFlow Deployment Helper"
echo "=============================="
echo ""

# Check if .ftp-deploy.json is configured
if grep -q "your-ftp-username" .ftp-deploy.json 2>/dev/null; then
    echo "⚠️  FTP credentials not configured!"
    echo ""
    echo "Please update the following files with your Hostinger FTP credentials:"
    echo "  1. .ftp-deploy.json (for frontend)"
    echo "  2. server/.ftp-deploy-server.json (for backend)"
    echo ""
    echo "Get your FTP credentials from:"
    echo "  Hostinger Control Panel → Files → FTP Accounts"
    echo ""
    exit 1
fi

echo "What would you like to deploy?"
echo ""
echo "1) Frontend only (website files)"
echo "2) Backend only (server code)"
echo "3) Both (full deployment)"
echo ""
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo "📦 Building frontend..."
        npm run build
        echo ""
        echo "📤 Deploying frontend to Hostinger..."
        node deploy.js
        ;;
    2)
        echo ""
        echo "📤 Deploying backend to Hostinger..."
        cd server && node deploy-server.js
        echo ""
        echo "💡 Don't forget to restart Node.js app in Hostinger control panel!"
        ;;
    3)
        echo ""
        echo "📦 Building frontend..."
        npm run build
        echo ""
        echo "📤 Deploying frontend..."
        node deploy.js
        echo ""
        echo "📤 Deploying backend..."
        cd server && node deploy-server.js
        echo ""
        echo "💡 Don't forget to restart Node.js app in Hostinger control panel!"
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment complete!"
echo "🌐 Check your website at your domain"
