import { build } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const hulymcpRoot = path.resolve(__dirname, "..");

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: "dist/index.cjs",
  external: [
    "ws",
    "@activepieces/pieces-framework",
    "@activepieces/pieces-common",
    "@activepieces/shared",
  ],
  minify: true,
  // Resolve @hulymcp/* path aliases to the hulymcp source tree
  // and resolve hcengineering/effect/etc packages from hulymcp's node_modules
  nodePaths: [path.join(hulymcpRoot, "node_modules")],
  alias: {
    "@hulymcp": path.join(hulymcpRoot, "src"),
  },
  // The hulymcp source uses .js extensions in imports (rewriteRelativeImportExtensions)
  // but the actual files are .ts — resolve .js to .ts
  resolveExtensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
  logLevel: "info",
});
