import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { callFinished } from "./lib/triggers/call-finished";

export const diga = createPiece({
  displayName: "Diga",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/diga.png",
  authors: [],
  actions: [],
  triggers: [callFinished],
});
    