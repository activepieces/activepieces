
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { stopFlow } from "./lib/actions/stop-flow";

    export const stopflow = createPiece({
      displayName: "Stop Flow",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48cGF0aCBmaWxsPSIjZmY3MjcyIiBkPSJNNSAzaDE0YTIgMiAwIDAgMSAyIDJ2MTRhMiAyIDAgMCAxLTIgMkg1YTIgMiAwIDAgMS0yLTJWNWEyIDIgMCAwIDEgMi0ybTggMTBWN2gtMnY2em0wIDR2LTJoLTJ2MnoiLz48L3N2Zz4=",
      description: 'A piece to immediately stop the flow execution.',
      authors: [],
      actions: [
        stopFlow
      ],
      triggers: [],
    });
    