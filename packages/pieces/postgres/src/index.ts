
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

export const postgres = createPiece({
  name: "postgres",
  displayName: "Postgres",
  logoUrl: "https://cdn.activepieces.com/pieces/postgres.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: [],
});
