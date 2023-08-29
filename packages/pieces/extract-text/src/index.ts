
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { nativeTextExtraction } from "./lib/actions/native-text-extraction";

export const extractText = createPiece({
  displayName: "Extract Text",
  description: "Extract text from documents",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.8.0',
  logoUrl: "https://cdn.activepieces.com/pieces/extract-text.png",
  authors: ['ArmanGiau'],
  actions: [nativeTextExtraction],
  triggers: [],
});
