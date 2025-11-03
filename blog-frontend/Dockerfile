# ----------------------------
# Stage 1: Build React/Vite app
# ----------------------------
FROM node:20-alpine AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy all source files
COPY . .

# Build the production-ready static files
RUN npm run build

# ----------------------------
# Stage 2: Serve static site
# ----------------------------
FROM node:20-alpine
WORKDIR /app

# Install a static file server
RUN npm install -g serve

# Copy built output from previous stage
# (CRA uses /build, Vite uses /dist)
COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
