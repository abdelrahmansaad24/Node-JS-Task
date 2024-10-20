FROM node:latest
WORKDIR /app

ENV NODE_ENV production

COPY package*.json

RUN npm install

COPY . .

RUN npm install -g pm2

EXPOSE 5000

CMD ["pm2-runtime", "server.js"]