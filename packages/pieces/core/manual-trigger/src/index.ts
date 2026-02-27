
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { manualTrigger } from "./lib/triggers/manual-trigger";
import { PieceCategory } from "@activepieces/shared";

export const manualTriggerPiece = createPiece({
      displayName: "Manual Trigger",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.78.0',
      logoUrl: "https://cdn.activepieces.com/pieces/new-core/manual-trigger.svg",
      authors: ['AbdulTheActivePiecer'],
      actions: [],
      triggers: [manualTrigger],
      categories:[PieceCategory.CORE]
    });
    