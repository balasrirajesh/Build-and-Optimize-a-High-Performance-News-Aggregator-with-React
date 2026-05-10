# Use an official Node runtime as a parent image
FROM node:20-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the remaining application code
COPY . .

# Build the application
RUN npm run build

# Use a lightweight Node image to serve the built files
FROM node:20-alpine

WORKDIR /app

# Install a simple static file server
RUN npm install -g serve

# Copy built assets from the builder stage
COPY --from=build /app/dist ./dist

# The port the app runs on
EXPOSE 3000

# Serve the static files on port 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
