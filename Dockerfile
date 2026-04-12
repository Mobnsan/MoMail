# Step 1: Build the React Frontend
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Build the Node.js Backend
FROM node:20
WORKDIR /app

# The 'node' user in this image already has UID 1000
# Ensure correct ownership of the app directory
RUN chown -R node:node /app

# Copy files and ensure the 'node' user owns them
COPY --chown=node:node server/package*.json ./server/
RUN cd server && npm install
COPY --chown=node:node server/ ./server/
COPY --chown=node:node --from=build /app/build ./build

# Create data directory and ensure it is writable by the 'node' user
RUN mkdir -p /app/server/data && chown -R node:node /app/server/data

USER node
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/server.js"]
