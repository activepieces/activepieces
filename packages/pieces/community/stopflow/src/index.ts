
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { stopFlow } from "./lib/actions/stop-flow";

    export const stopflow = createPiece({
      displayName: "Stop Flow",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/stopflow.png",
      description: 'A piece to immediately stop the flow execution.',
      authors: [],
      actions: [
        stopFlow
      ],
      triggers: [],
    });
    