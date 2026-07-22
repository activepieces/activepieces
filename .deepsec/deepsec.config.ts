import { defineConfig } from "deepsec/config";

export default defineConfig({
  defaultAgent: "claude",
  projects: [
    {
      id: "server-api",
      root: "../packages/server/api",
      priorityPaths: [
        "src/app/authentication",
        "src/app/core/security",
        "src/app/ee/oauth-apps",
        "src/app/mcp/oauth",
      ],
    },
    {
      id: "server-engine",
      root: "../packages/server/engine",
      priorityPaths: [
        "src/lib/core/code",
        "src/lib/network",
        "src/lib/variables",
      ],
    },
    {
      id: "server-worker",
      root: "../packages/server/worker",
      priorityPaths: ["src/lib/sandbox"],
    },
    { id: "server-utils", root: "../packages/server/utils" },
    { id: "web", root: "../packages/web" },
    { id: "shared", root: "../packages/shared" },
    {
      id: "pieces-common",
      root: "../packages/pieces/common",
      priorityPaths: [
        "src/lib/http",
        "src/lib/authentication",
        "src/lib/validation",
      ],
    },
    {
      id: "pieces-core",
      root: "../packages/pieces/core",
      priorityPaths: [
        "http/src/lib/actions",
        "pdf/src/lib/actions",
        "file-helper/src/lib/actions",
        "graphql/src/lib/actions",
        "sftp/src/lib/actions",
        "smtp/src/lib/actions",
      ],
    },
  ],
});
