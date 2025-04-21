# Build docs
FROM node:18-alpine AS build
WORKDIR /app

# Copy the entire project first
COPY .. /app/project

# Copy package files, tsconfig, and .npmrc
WORKDIR /app/project
COPY package.json package-lock.json tsconfig.json .npmrc ./
RUN npm ci

# Generate docs
RUN npm run gen-docs

# Serve docs with nginx
FROM nginx:alpine

# Copy custom nginx config for SPA routing
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/

# Copy generated docs to nginx serve directory
COPY --from=build /app/project/docs /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
