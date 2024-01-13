
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { httpReturnResponse } from "./lib/actions/return-response";

export const acpTwilioResponse = createPiece({
  displayName: "Acp-twilio-response",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/http.png",
  authors: ['acedEmpire'],
  actions: [httpReturnResponse],
  triggers: [],
});
