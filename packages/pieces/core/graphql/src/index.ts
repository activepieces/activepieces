
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { query } from "./lib/actions/query";
import { PieceCategory } from "@activepieces/shared";
    
    export const graphql = createPiece({
      displayName: "GraphQL",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.30.0',
      logoUrl: "https://cdn.activepieces.com/pieces/graphql.svg",
      categories:[PieceCategory.CORE],
      authors: ['mahmuthamet'],
      actions: [query],
      triggers: [],
    });
    