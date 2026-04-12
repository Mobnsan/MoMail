# Step 1: Build the React Frontend
FROM node:20 AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Step 2: Build the Node.js Backend
FROM node:20
# Hugging Face runs with UID 1000
RUN useradd -m -u 1000 user
WORKDIR /app

# Ensure correct ownership
COPY --chown=user server/package*.json ./server/
RUN cd server && npm install
COPY --chown=user server/ ./server/
COPY --chown=user --from=build /app/build ./build

# Create data directory and ensure it is writable
RUN mkdir -p /app/server/data && chown -R user:user /app/server/data

USER user
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/server.js"]
