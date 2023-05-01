
import { createPiece, PieceType } from "@activepieces/pieces-framework";
import packageJson from "../package.json";
import { sendMessage } from "./lib/actions/send-message";

export const matrix = createPiece({
  name: "matrix",
  displayName: "Matrix",
  logoUrl: "https://cdn.activepieces.com/pieces/matrix.png",
  version: packageJson.version,
  type: PieceType.PUBLIC,
  minimumSupportedRelease: "0.3.9",
  authors: ["abuaboud"],
  actions: [sendMessage],
  triggers: [],
});
