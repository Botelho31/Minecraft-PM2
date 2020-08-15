FROM timbru31/java-node
RUN node -v
RUN java -version
WORKDIR /app
COPY package.json /app
RUN npm install
COPY . /app
EXPOSE 3000/tcp
EXPOSE 25565/tcp
EXPOSE 25565/udp
RUN apt-get update
RUN apt-get install wget
ENV SETUPSERVER=false
CMD npm start