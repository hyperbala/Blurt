#!/bin/bash
# Deploy script for AWS Lighthouse

# Install Node.js 18.x if not already installed
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clear npm cache and node_modules
rm -rf .next
rm -rf node_modules
npm cache clean --force

# Install dependencies
npm install

# Build the application
NODE_ENV=production npm run build

# Start the application
npm start