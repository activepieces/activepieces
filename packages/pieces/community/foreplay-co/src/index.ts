
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { getAdById, getAdsByPage, findBrands, findAds, findBoards } from "./lib/actions";
    import { newAdInSpyder, newAdInBoard, newSwipefileAd } from "./lib/triggers";

    export const foreplayCo = createPiece({
      displayName: "Foreplay-co",
      auth: PieceAuth.SecretText({
        displayName: "API Key",
        description: "Your Foreplay.co API key",
        required: true,
      }),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/foreplay-co.png",
      authors: [],
      actions: [getAdById, getAdsByPage, findBrands, findAds, findBoards],
      triggers: [newAdInSpyder, newAdInBoard, newSwipefileAd],
    });
    