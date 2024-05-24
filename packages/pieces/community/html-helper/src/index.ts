
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { extractElementByQuery } from "./lib/actions/extract-attribute";
import { getElementById } from "./lib/actions/get-element-by-id";
    
export const htmlHelper = createPiece({
  displayName: "Html Helper",
  auth: PieceAuth.None(),
  description: "Tools to manipulate HTML",
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://cdn.activepieces.com/pieces/html-helper.png",
  authors: ['pfernandez98'],
  actions: [extractElementByQuery, getElementById],
  triggers: [],
});
    