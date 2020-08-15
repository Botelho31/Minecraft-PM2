FROM node:9-slim
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
EXPOSE 3000/tcp
RUN apt-get update
RUN wget -O server/minecraft_server.jar https://launcher.mojang.com/v1/objects/a412fd69db1f81db3f511c1463fd304675244077/server.jar
RUN sudo apt-get -y --allow-change-held-packages install openjdk-8-jdk
RUN java -version
RUN java -Xmx1G -Xms1G -jar server/minecraft_server.jar nogui
CMD npm start