
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

export const sendinblue = createPiece({
  name: "sendinblue",
  displayName: "Sendinblue",
  logoUrl: "https://cdn.activepieces.com/pieces/sendinblue.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: [],
});
