FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install && npx tsc

COPY . .

RUN npx tsc

EXPOSE 8080

CMD ["npm", "start"]
