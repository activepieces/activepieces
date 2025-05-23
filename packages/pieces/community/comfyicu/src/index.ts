
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

    export const comfyicu = createPiece({
      displayName: "Comfy.ICU",
      categories:[PieceCategory.ARTIFICIAL_INTELLIGENCE],
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/comfyicu.png",
      authors: ['rimjhimyadav'],
      actions: [],
      triggers: [],
    });
    