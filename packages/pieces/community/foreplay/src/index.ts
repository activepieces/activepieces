
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { findAds } from "./lib/actions/find-ads";
import { findBoard } from "./lib/actions/find-board";
import { findBrands } from "./lib/actions/find-brands";
import { getAdById } from "./lib/actions/get-ad-by-id";
import { getAdsByPage } from "./lib/actions/get-ads-by-page";
import { newAdInBoard } from "./lib/triggers/new-ad-in-board";
import { newAdInSpyder } from "./lib/triggers/new-ad-in-spyder";
import { newSwipefileAd } from "./lib/triggers/new-swipefile-ad";
import { ForeplayAuth } from "./lib/common/auth";

export const foreplay = createPiece({
  displayName: "Foreplay",
  auth: ForeplayAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/foreplay.png",
  authors: ['Niket2035'],
  actions: [
    findAds,
    findBoard,
    findBrands,
    getAdById,
    getAdsByPage
  ],
  triggers: [
    newAdInBoard,
    newAdInSpyder,
    newSwipefileAd
  ],
});
