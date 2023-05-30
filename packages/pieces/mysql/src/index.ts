
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import actions from "./lib/actions";

export const mysql = createPiece({
  name: "mysql",
  displayName: "MySQL",
  logoUrl: "https://cdn.activepieces.com/pieces/mysql.png",
  version: packageJson.version,
  authors: [],
  actions,
  triggers: [],
});
