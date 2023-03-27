
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";

export const webflow = createPiece({
  name: "webflow",
  displayName: "Webflow",
  logoUrl: "https://cdn.activepieces.com/pieces/webflow.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: [],
});
