
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { manualTrigger } from "./lib/triggers/manual-trigger";
import { PieceCategory } from "@activepieces/shared";

export const manualTriggerPiece = createPiece({
      displayName: "Manual Trigger",
      auth: PieceAuth.None(),
      // minimumSupportedRelease: '0.77.5',
      logoUrl: "https://cdn.activepieces.com/mouse-pointer-click.svg",
      authors: [],
      actions: [],
      triggers: [manualTrigger],
      categories:[PieceCategory.CORE]
    });
    