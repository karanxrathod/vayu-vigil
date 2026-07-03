#!/usr/bin/env bash
# ==========================================================
# Vayu Vigil — Cloud Run Backend Deployment Script
# Run this after: gcloud auth login && gcloud auth configure-docker
# ==========================================================
set -e

PROJECT_ID="${GCP_PROJECT_ID:-YOUR_GCP_PROJECT_ID}"
REGION="${GCP_REGION:-asia-south1}"           # Mumbai — closest to Delhi pilot ward
SERVICE_NAME="vayu-vigil-backend"
IMAGE="gcr.io/${PROJECT_ID}/${SERVICE_NAME}:latest"

echo "==================================================="
echo "Vayu Vigil — Deploying Backend to Cloud Run"
echo "Project: ${PROJECT_ID}  |  Region: ${REGION}"
echo "==================================================="

# 1. Set project
gcloud config set project "${PROJECT_ID}"

# 2. Enable required APIs (idempotent)
gcloud services enable run.googleapis.com containerregistry.googleapis.com

# 3. Build and push the Docker image from the backend directory
echo "[1/3] Building Docker image..."
docker build -f Dockerfile.backend -t "${IMAGE}" .

echo "[2/3] Pushing to Container Registry..."
docker push "${IMAGE}"

# 4. Deploy to Cloud Run
echo "[3/3] Deploying to Cloud Run (${REGION})..."
gcloud run deploy "${SERVICE_NAME}" \
  --image "${IMAGE}" \
  --platform managed \
  --region "${REGION}" \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production,MOCK_MODE=false,WEBHOOK_LOG_ONLY=true,SIMULATOR_INTERVAL_MS=30000,SCORING_INTERVAL_MS=60000,JWT_SECRET=${JWT_SECRET:-supersecrethackathonkey2026}" \
  --set-env-vars "GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --port 8080

# 5. Get the deployed URL
SERVICE_URL=$(gcloud run services describe "${SERVICE_NAME}" --region "${REGION}" --format "value(status.url)")
echo ""
echo "==================================================="
echo "✅ DEPLOYMENT COMPLETE"
echo "Backend URL: ${SERVICE_URL}"
echo ""
echo "Next step: Set NEXT_PUBLIC_API_URL=${SERVICE_URL} in your Vercel"
echo "  environment variables, then redeploy the frontend:"
echo "  vercel env add NEXT_PUBLIC_API_URL ${SERVICE_URL}"
echo "==================================================="
