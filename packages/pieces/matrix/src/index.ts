
import { createPiece } from "@activepieces/pieces-framework";
import { sendMessage } from "./lib/actions/send-message";

export const matrix = createPiece({
  displayName: "Matrix",
  logoUrl: "https://cdn.activepieces.com/pieces/matrix.png",
  minimumSupportedRelease: "0.3.9",
  authors: ["abuaboud"],
  actions: [sendMessage],
  triggers: [],
});
