import { createPiece, PieceAuth } from "@activepieces/pieces-framework"
import { shortioAuth } from "./lib/common"
import { newLinkCreated } from "./lib/triggers/new-link-created"
import { createShortLink } from "./lib/actions/create-short-link"
import { updateLink } from "./lib/actions/update-link"

export const shortio = createPiece({
  displayName: "Shortio",
  auth: shortioAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/shortio.png",
  authors: [],
  actions: [createShortLink, updateLink],
  triggers: [newLinkCreated],
});
