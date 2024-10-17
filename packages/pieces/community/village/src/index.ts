
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { fetchPeoplePaths } from "./lib/actions/fetch-people-paths";
import { fetchCompaniesPaths } from "./lib/actions/fetch-companies-paths";

    export const villageAuth = PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
      description: 'Your Village API Key',
    });
    
    
    export const village = createPiece({
      displayName: "Village",
      auth: villageAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/village.png",
      authors: [],
      actions: [fetchPeoplePaths, fetchCompaniesPaths],
      triggers: [],
    });
    