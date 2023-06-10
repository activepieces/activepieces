
import { createPiece } from "@activepieces/pieces-framework";
import { textToImage } from "./lib/actions/text-to-image";

export const stabilityAi = createPiece({
  displayName: "Stability AI",
  logoUrl: "https://cdn.activepieces.com/pieces/stability-ai.png",
  authors: ["Willianwg"],
  actions: [textToImage],
  triggers: [],
});
