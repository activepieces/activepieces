
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { echoMessage } from './lib/actions';


    export const testing = createPiece({
      displayName: "Testing",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/testing.png",
      authors: [ "testing piece" ],
      actions: [echoMessage],
      triggers: [],
    });
    