import { createPiece, PieceAuth } from "@activepieces/pieces-framework"
import { shortioAuth } from "./lib/common"
import { newLinkCreated } from "./lib/triggers/new-link-created"

export const shortio = createPiece({
  displayName: "Shortio",
  auth: shortioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/shortio.png",
  authors: [],
  actions: [],
  triggers: [newLinkCreated],
});
