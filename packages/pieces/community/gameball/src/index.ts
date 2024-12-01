
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { sendEvent } from "./lib/actions/send-event";

export const gameballAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please use your gameball api key. visit [help center](https://help.gameball.co/en/articles/3467114-get-your-account-integration-details-api-key-and-transaction-key) for more information',
});

export const gameball = createPiece({
  displayName: "Gameball",
  auth: gameballAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/gameball.png",
  authors: ["Raamyy"],
  actions: [sendEvent],
  triggers: [],
});
