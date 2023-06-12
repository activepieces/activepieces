
import { createPiece } from "@activepieces/pieces-framework";
import actions from "./lib/actions";

export const mysql = createPiece({
  displayName: "MySQL",
  logoUrl: "https://cdn.activepieces.com/pieces/mysql.png",
  authors: ["JanHolger"],
  actions,
  triggers: [],
});
