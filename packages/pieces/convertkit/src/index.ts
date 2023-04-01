
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { convertKitTriggers } from "./lib/triggers";

export const convertkit = createPiece({
  name: "convertkit",
  displayName: "Convertkit",
  logoUrl: "https://media.convertkit.com/images/logos/convertkit-logomark-red.png",
  version: packageJson.version,
  authors: [],
  actions: [],
  triggers: convertKitTriggers,
});
