// PKG_VERSION is injected by esbuild at build time via --define
export const VERSION: string = typeof PKG_VERSION !== "undefined" ? PKG_VERSION : "0.0.0-dev"
