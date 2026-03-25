
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { startBrowsingTask } from "./lib/actions/start-browsing-task";
    
    export const twinLabsAuth = PieceAuth.SecretText({
      displayName:'API Key',
      required:true,
      description:"Please use ***your-twin-labs-api-key*** as value for API Key"
    });

    export const twinLabs = createPiece({
      displayName: "Twin Web Agent",
      auth: twinLabsAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/twin-labs.png",
      authors: [],
      actions: [startBrowsingTask],
      triggers: [],
    });
    