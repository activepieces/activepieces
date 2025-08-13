
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const huggingFace = createPiece({
      displayName: "Hugging-face",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/hugging-face.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    