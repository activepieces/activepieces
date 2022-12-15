#
# Build stage
#
FROM maven:3.8.6-openjdk-11 AS build
COPY . /home/app
RUN mvn -f /home/app/pom.xml clean package

#
# Package stage
#
FROM debian:bullseye
RUN apt-get update
RUN apt-get install -y default-jre
RUN apt-get install -y curl \
  && apt-get update && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt-get install -y nodejs \
  && curl -L https://www.npmjs.com/install.sh | sh
# Set the locale
RUN apt-get update && apt-get install -y --no-install-recommends \
    locales \
    locales-all
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US:en
ENV LC_ALL en_US.UTF-8
RUN apt-get install -y libcap-dev
COPY backend-loader/default.cf /usr/local/etc/isolate
COPY backend-loader/isolate /isolate
ARG JAR_FILE
RUN npm install --global --unsafe-perm webpack@5.74.0
RUN npm install --global --unsafe-perm webpack-cli@^4.10.0
RUN npm install --global --unsafe-perm webpack-node-externals@^3.0.0
EXPOSE 8000
COPY --from=build /home/app/backend-loader/target/backend-loader-1.0.jar /usr/local/lib/demo.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar /usr/local/lib/demo.jar"]
