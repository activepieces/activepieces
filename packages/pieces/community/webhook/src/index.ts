
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { catchRequest } from "./lib/triggers/catch-hook";

export const webhook = createPiece({
  displayName: "Webhook",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.21.0',
  logoUrl: "https://cdn.activepieces.com/pieces/webhook.svg",
  authors: [],
  actions: [],
  triggers: [catchRequest],
});
