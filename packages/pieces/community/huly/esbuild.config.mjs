import { build } from "esbuild";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Huly SDK deps (effect, @hcengineering/*) must be resolvable by esbuild.
// In AP CI they come from devDependencies in package.json.
// For local dev, fall back to the hulymcp sibling project's node_modules.
const extraNodePaths = [];
const hulymcpNodeModules = path.resolve(__dirname, "../../../../..", "hulymcp", "node_modules");
if (fs.existsSync(hulymcpNodeModules)) {
  extraNodePaths.push(hulymcpNodeModules);
}

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/src/index.js",
  external: [
    "ws",
    "@activepieces/pieces-framework",
    "@activepieces/pieces-common",
    "@activepieces/shared",
  ],
  minify: true,
  // Resolve @hulymcp/* path aliases to vendored hulymcp source
  alias: {
    "@hulymcp": path.join(__dirname, "src", "vendor", "hulymcp"),
  },
  // Huly SDK deps from devDependencies or hulymcp sibling
  nodePaths: extraNodePaths,
  // The hulymcp source uses .js extensions in imports (rewriteRelativeImportExtensions)
  // but the actual files are .ts — resolve .js to .ts
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  logLevel: "info",
});
