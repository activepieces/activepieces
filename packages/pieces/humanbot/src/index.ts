import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

export const humanbot = createPiece({
  displayName: "Humanbot",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: "https://app.humanbot.io/img/logo-small.png",
  authors: [],
  actions: [],
  triggers: [],
});
