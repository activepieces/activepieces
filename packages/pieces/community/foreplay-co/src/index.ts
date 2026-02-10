
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { getAdById, getAdsByPage, findBrands, findAds, findBoards } from "./lib/actions";
import { newAdInSpyder, newAdInBoard, newSwipefileAd } from "./lib/triggers";

export const foreplayCoAuth = PieceAuth.SecretText({
  displayName: "API Key",
  description: "Your Foreplay.co API key",
  required: true,
})
export const foreplayCo = createPiece({
  displayName: "Foreplay",
  description: "Competitive advertising data and creative insights platform. Search, filter, and analyze ads and brands with live and historical ad creatives, metadata, and competitive intelligence.",
    auth: foreplayCoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/foreplay-co.png",
  categories: [PieceCategory.MARKETING],
  authors: ['fortunamide', 'onyedikachi-david'],
  actions: [getAdById, getAdsByPage, findBrands, findAds, findBoards],
  triggers: [newAdInSpyder, newAdInBoard, newSwipefileAd],
});
    