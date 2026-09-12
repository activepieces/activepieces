
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { manualTrigger } from "./lib/triggers/manual-trigger";
import { PieceCategory } from "@activepieces/pieces-framework";

export const manualTriggerPiece = createPiece({
      displayName: "Manual Trigger",
      description: 'Start a flow on demand with a button click.',
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.78.0',
      logoUrl: "https://cdn.activepieces.com/pieces/new-core/manual-trigger.svg",
      authors: ['AbdulTheActivePiecer'],
      actions: [],
      triggers: [manualTrigger],
      categories:[PieceCategory.CORE]
    });
    