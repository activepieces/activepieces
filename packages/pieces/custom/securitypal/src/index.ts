
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { spCopilot } from "./lib/actions/sp-copilot";

    export const securitypal = createPiece({
      displayName: "Securitypal",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/agent.png",
      authors: [],
      actions: [spCopilot],
      triggers: [],
    });
    