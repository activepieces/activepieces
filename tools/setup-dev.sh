rm -rf node_modules
npm ci
npx pnpm store add \
  @tsconfig/node18@1.0.1 \
  ts-loader@9.4.2 \
  typescript@4.8.4 \
  webpack@5.74.0 \
  webpack-cli@4.10.0
