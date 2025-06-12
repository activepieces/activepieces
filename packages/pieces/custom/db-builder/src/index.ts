
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { list } from "./lib/actions/list";

    export const dbBuilderAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Please use **test-key** as value for API Key',
    });

    export const dbBuilder = createPiece({
      displayName: "Db-builder",
      auth: dbBuilderAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/db-builder.png",
      authors: [],
      actions: [list],
      triggers: [],
    });

    