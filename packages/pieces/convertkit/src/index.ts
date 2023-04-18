
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { convertKitTriggers } from "./lib/triggers";

export const convertkit = createPiece({
  name: "convertkit",
  displayName: "ConvertKit",
  logoUrl: "https://cdn.activepieces.com/pieces/convertkit.png",
  version: packageJson.version,
  authors: ["mukewa"],
  actions: [],
  triggers: convertKitTriggers,
});
