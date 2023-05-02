
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { textToImage } from "./lib/actions/text-to-image";

export const stabilityAi = createPiece({
  name: "stability-ai",
  displayName: "Stability AI",
  logoUrl: "https://cdn.activepieces.com/pieces/stability-ai.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [textToImage],
  triggers: [],
});
