
import { createPiece } from "@activepieces/pieces-framework";
import packageJson from "../package.json";

export const stabilityAi = createPiece({
  name: "stability-ai",
  displayName: "Stability AI",
  logoUrl: "https://cdn.activepieces.com/pieces/stability-ai.png",
  version: packageJson.version,
  authors: ["Willianwg"],
  actions: [],
  triggers: [],
});
