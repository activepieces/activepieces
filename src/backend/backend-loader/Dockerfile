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
EXPOSE 4000
RUN apt-get install -y libcap-dev
COPY default.cf /usr/local/etc/isolate
COPY isolate /isolate
ARG JAR_FILE
RUN npm install --global --unsafe-perm webpack@5.74.0
RUN npm install --global --unsafe-perm webpack-cli@^4.10.0
RUN npm install --global --unsafe-perm webpack-node-externals@^3.0.0
COPY ${JAR_FILE} /app.jar
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Djava.security.egd=file:/dev/./urandom -jar /app.jar"]