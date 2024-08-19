
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { executeFlow } from "./lib/actions/execute-flow";
    
    export const flows = createPiece({
      displayName: "Call Flow",
      description: "Trigger and run another predefined workflow.",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/flows.svg",
      authors: ['hazemadelkhalel'],
      actions: [executeFlow],
      triggers: [],
    });
    