FROM node:24-bookworm-slim

RUN apt-get update && apt-get install -y restic && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the frontend files
COPY package.json package-lock.json* ./
RUN npm install

# Copy backend files
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm install

# Copy source code
COPY . .

# Build frontend
RUN npm run build

# Build backend
RUN cd backend && npm run build

# Expose port 3000
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

# Start backend server
CMD ["node", "backend/dist/index.js"]
