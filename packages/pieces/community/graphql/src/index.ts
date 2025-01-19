
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { query } from "./lib/actions/query";
    
    export const graphql = createPiece({
      displayName: "Graphql",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://www.svgrepo.com/show/353834/graphql.svg",
      authors: ['Hamet'],
      actions: [query],
      triggers: [],
    });
    