
import { createPiece } from "@activepieces/framework";
import packageJson from "../package.json";
import { sendMessage } from "./lib/actions/send-message";

export const matrix = createPiece({
  name: "matrix",
  displayName: "Matrix",
  logoUrl: "https://cdn.activepieces.com/pieces/matrix.png",
  version: packageJson.version,
  minimumSupportedRelease: "0.3.9",
  authors: ["abuaboud"],
  actions: [sendMessage],
  triggers: [],
});
