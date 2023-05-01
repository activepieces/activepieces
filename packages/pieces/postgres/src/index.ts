
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { runQuery } from "./lib/actions/run-query";

export const postgres = createPiece({
  name: "postgres",
  displayName: "Postgres",
  logoUrl: "https://cdn.activepieces.com/pieces/postgres.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  authors: ["Willianwg"],
  actions: [runQuery],
  triggers: [],
});
