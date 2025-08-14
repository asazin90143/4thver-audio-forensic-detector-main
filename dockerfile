# Base image
FROM python:3.11-slim

WORKDIR /app

# Install Node.js, curl, build-essential, and nginx
RUN apt-get update && apt-get install -y curl build-essential nginx \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm

# Copy Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy Node dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .

# Build frontend (Next.js/React)
RUN npm run build

# Configure nginx
RUN rm /etc/nginx/sites-enabled/default
COPY nginx.conf.template /etc/nginx/conf.d/default.conf.template

# Expose Render's port
ENV PORT=10000
EXPOSE $PORT

# Start frontend, backend, and nginx
CMD sh -c "\
    npm run start & \
    python -u -c \"import os; from app import app; app.run(host='0.0.0.0', port=8000)\" & \
    envsubst '\$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && \
    nginx -g 'daemon off;' \
"
# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s \
    CMD curl -f http://localhost:$PORT/ || exit 1               