
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

export const xero = createPiece({
  name: "xero",
  displayName: "Xero",
  logoUrl: "https://cdn.activepieces.com/pieces/xero.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: [],
});
