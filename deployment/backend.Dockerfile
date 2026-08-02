# Contexto de build: raiz del proyecto (CustomHTTP/)
FROM node:20-alpine
WORKDIR /app
COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --omit=dev
COPY backend ./backend
COPY database ./database
WORKDIR /app/backend
EXPOSE 8080
CMD ["node", "src/index.js"]
