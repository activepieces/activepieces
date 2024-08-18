
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { executeFlow } from "./lib/actions/execute-flow";
    
    export const flowInvoke = createPiece({
      displayName: "Flow Invoke",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn-icons-png.freepik.com/256/9641/9641025.png?semt=ais_hybrid",
      authors: ['hazemadelkhalel'],
      actions: [executeFlow],
      triggers: [],
    });
    