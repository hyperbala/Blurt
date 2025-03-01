# Use official Node.js image
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy everything else
COPY . .

# Build Next.js app
RUN npm run build

# Start app in production mode
CMD ["npm", "start"]
