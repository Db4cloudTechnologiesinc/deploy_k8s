# ---------- Build Stage ----------
    FROM node:18-slim AS builder

    WORKDIR /app
    
    COPY package*.json ./
    RUN npm install --legacy-peer-deps
    
    COPY . .
    
    ENV NODE_OPTIONS=--max-old-space-size=8192
    ENV GENERATE_SOURCEMAP=false
    
    RUN npm run build
    
    # ---------- Nginx Stage ----------
    FROM nginx:alpine
    
    # Remove default nginx page
    RUN rm -rf /usr/share/nginx/html/*
    
    # Copy React build
    COPY --from=builder /app/build /usr/share/nginx/html
    
    # Copy custom nginx config
    COPY nginx.conf /etc/nginx/conf.d/default.conf
    
    EXPOSE 80
    CMD ["nginx", "-g", "daemon off;"]
    