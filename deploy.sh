#!/bin/bash

# Exit if any command fails
set -e

PORT=8080
CONTAINER_NAME=flows-prophone

echo "🔄 Pulling latest code from GitHub..."
git pull origin main

if [[ -n $(git status --porcelain) ]]; then
  echo "💾 Committing local server-side changes..."
  git add .
  git commit -m 'Server-side updates before deploy'
  git push origin main
else
  echo "✅ No changes to commit."
fi

echo "🛑 Stopping and removing ALL containers..."
docker ps -aq | xargs -r docker stop
docker ps -aq | xargs -r docker rm

echo "🧹 Removing ALL Docker images..."
docker images -aq | xargs -r docker rmi -f

echo "🧹 Pruning Docker system and build cache..."
docker builder prune -af
docker system prune -af --volumes

echo "♻️ Restarting Docker service..."
systemctl restart docker
echo "✅ Docker restarted successfully!"

# Extra failsafe: Check for any remaining process using port 8080
PID=$(lsof -t -i:$PORT || true)
if [ -n "$PID" ]; then
  echo "⚠️ Port $PORT is still in use by PID $PID. Killing it..."
  kill -9 "$PID"
  echo "✅ Port $PORT has been freed."
else
  echo "✅ Port $PORT is already free."
fi

echo "🧱 Building Docker image..."
docker build --network=host -t $CONTAINER_NAME .

echo "🚀 Launching new Docker container..."
echo "📡 Using server IP: $SERVER_IP"
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p $PORT:80 \
  -v ~/.flows:/root/.flows \
  -e AP_QUEUE_MODE=REDIS \
  -e AP_REDIS_HOST=172.17.0.1 \
  -e AP_REDIS_PORT=6379 \
  -e AP_REDIS_DB=0 \
  -e AP_DB_TYPE=POSTGRES \
  -e AP_POSTGRES_DATABASE=activepieces \
  -e AP_POSTGRES_HOST=172.17.0.1 \
  -e AP_POSTGRES_PORT=5432 \
  -e AP_POSTGRES_USERNAME=postgres \
  -e AP_POSTGRES_PASSWORD=flow \
  -e AP_POSTGRES_USE_SSL=false \
  -e AP_ENVIRONMENT=prod \
  -e AP_ENCRYPTION_KEY=25bf27dde53ccd8eca4fd3530d692045 \
  -e AP_JWT_SECRET=7402d5cf31698ab \
  -e AP_API_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890 \
  -e AP_FRONTEND_URL="https://flow.prophone.io" \
  -e AP_WEBHOOK_TIMEOUT_SECONDS=30 \
  -e AP_TRIGGER_DEFAULT_POLL_INTERVAL=5 \
  -e AP_EXECUTION_MODE=UNSANDBOXED \
  -e AP_FLOW_TIMEOUT_SECONDS=600 \
  -e AP_TELEMETRY_ENABLED=true \
  -e AP_TEMPLATES_SOURCE_URL="https://cloud.activepieces.com/api/v1/flow-templates" \
  -e AP_ENGINE_EXECUTABLE_PATH=dist/packages/engine/main.js \
  $CONTAINER_NAME

echo "✅ Deployment complete! Visit: https://flow.prophone.io"
