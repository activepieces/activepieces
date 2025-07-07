
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

import { klaviyoAuth } from "./lib/common/auth";

export const klaviyo = createPiece({
  displayName: "Klaviyo",
  auth: klaviyoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/klaviyo.png",
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
