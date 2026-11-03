
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { query } from "./lib/actions/query";
import { PieceCategory } from "@activepieces/pieces-framework";
    
    export const graphql = createPiece({
      displayName: "GraphQL",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.88.2',
      logoUrl: "https://cdn.activepieces.com/pieces/graphql.svg",
      categories:[PieceCategory.CORE],
      authors: ['mahmuthamet'],
      actions: [query],
      triggers: [],
    });
    