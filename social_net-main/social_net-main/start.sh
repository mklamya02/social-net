#!/bin/bash

# Simple script to start the entire social media project

echo "🚀 Starting Social Media Platform..."

# 1. Check if docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker and try again."
  exit 1
fi

# 2. Start everything using Docker Compose
echo "📦 Building and starting containers..."
docker compose up --build -d

echo "----------------------------------------"
echo "✅ All services are starting up!"
echo "🌐 Frontend: http://localhost:8080"
echo "📡 Backend API: http://localhost:3000"
echo "🗄️  MongoDB: localhost:27017"
echo "☁️  MinIO Console: http://localhost:9001"
echo "----------------------------------------"
echo "💡 Use 'docker compose logs -f' to see real-time logs."
echo "💡 Use 'docker compose down' to stop the project."
