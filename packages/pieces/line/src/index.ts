
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { pushMessage } from "./lib/actions/push-message";
import { newMessage } from "./lib/trigger/new-message";

export const lineAuth2 = PieceAuth.SecretText({
  displayName: "Bot Token",
  required: true,
})

export const line = createPiece({
  displayName: "Line Bot",
  auth: lineAuth2,
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://cdn.activepieces.com/pieces/line.png",
  authors: ["abuaboud"],
  actions: [pushMessage],
  triggers: [newMessage],
});
