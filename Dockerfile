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
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
COPY --from=build /app/build ./build

# Expose the port
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/server.js"]
