
import { createPiece, PieceAuth } from "@ensemble/pieces-framework";
import { query } from "./lib/actions/query";
import { PieceCategory } from "@ensemble/shared";
    
    export const graphql = createPiece({
      displayName: "GraphQL",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.30.0',
      logoUrl: "https://cdn.ensemble.com/pieces/graphql.svg",
      categories:[PieceCategory.CORE],
      authors: ['mahmuthamet'],
      actions: [query],
      triggers: [],
    });
    