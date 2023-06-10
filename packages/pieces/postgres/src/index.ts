
import { createPiece } from "@activepieces/pieces-framework";
import { runQuery } from "./lib/actions/run-query";

export const postgres = createPiece({
  displayName: "Postgres",
  logoUrl: "https://cdn.activepieces.com/pieces/postgres.png",
  authors: ["Willianwg"],
  actions: [runQuery],
  triggers: [],
});
