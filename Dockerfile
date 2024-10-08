FROM node:latest

USER root

WORKDIR /usr/src/slb

COPY package*.json ./

RUN npm install

COPY . . 

CMD ["npx", "tsx", "/usr/src/slb/src/main.ts"]
