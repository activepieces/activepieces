FROM activepieces/ap-base:1

WORKDIR /usr/src/app
COPY . .

RUN npm ci
RUN npx nx build backend
RUN npx nx build engine

EXPOSE 3000

ENTRYPOINT ["node", "dist/packages/backend/main.js"]
