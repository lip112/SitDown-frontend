FROM node:22-alpine

WORKDIR /app

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

RUN npm install -g serve@14.2.4

EXPOSE 3001

CMD ["serve", "-s", "dist", "-l", "3001"]
