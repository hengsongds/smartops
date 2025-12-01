# SmartOps Platform - Docker Deployment Guide

This guide describes how to deploy the SmartOps Platform using Docker. The solution uses a multi-stage build process to ensure a lightweight and secure production image, running on Nginx (Alpine Linux).

## Prerequisites

- **OS**: Linux (CentOS 7/8, EulerOS, Ubuntu, etc.) or any OS with Docker support.
- **Docker**: Installed and running (Version 20.10+ recommended).

## Files Overview

- `Dockerfile`: Multi-stage build script (Node.js Build -> Nginx Runtime).
- `nginx.conf`: Web server configuration for Single Page Application (SPA).
- `package.json` & `vite.config.ts`: Frontend build configuration.

## Deployment Steps

### 1. Build the Docker Image

You need to provide your Gemini `API_KEY` during the build process. This ensures the key is available to the frontend application.

> **Note**: In a strict production environment, consider fetching keys from a backend proxy rather than baking them into the frontend build.

Run the following command in the project root directory:

```bash
# Replace 'your_actual_api_key_here' with your real Gemini API Key
docker build \
  --build-arg API_KEY=your_actual_api_key_here \
  -t smartops-platform:v1 .
```

### 2. Run the Container

Start the container and map it to a port (e.g., port 8080 on the host).

```bash
docker run -d \
  --name smartops \
  --restart always \
  -p 8080:80 \
  smartops-platform:v1
```

### 3. Verify Deployment

Open your browser and verify the platform is running:
- URL: `http://<your-server-ip>:8080`

### 4. Manage Container

```bash
# View Logs
docker logs -f smartops

# Stop Container
docker stop smartops

# Remove Container
docker rm smartops
```

## Troubleshooting (CentOS / EulerOS)

If you cannot access the port, check your firewall (firewalld):

```bash
# Allow port 8080 (CentOS/EulerOS)
firewall-cmd --zone=public --add-port=8080/tcp --permanent
firewall-cmd --reload
```

## Directory Structure in Container

- **Web Root**: `/usr/share/nginx/html`
- **Config**: `/etc/nginx/conf.d/default.conf`
