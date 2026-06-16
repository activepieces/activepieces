FROM node:22-slim
WORKDIR /app
# Bundle is produced on the host by esbuild (see build.sh) so the image stays tiny.
COPY dist/smoke.cjs ./smoke.cjs
CMD ["node", "smoke.cjs"]
