
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";

    export const microsoft365planner = createPiece({
      displayName: "Microsoft365planner",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/microsoft365planner.png",
      authors: [],
      actions: [],
      triggers: [],
    });
    