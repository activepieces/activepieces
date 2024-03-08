
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
    import { convertTextToJson } from "./lib/actions/convert-text-to-json";
    import { convertJsonToText } from "./lib/actions/convert-json-to-text";
    
    export const jsonAuth = PieceAuth.SecretText({   
      displayName: 'API Key',
      required: true,
      description: 'Please use **test-key** as value for API Key',
    });

    export const json = createPiece({
      displayName: "Json",
      auth: PieceAuth.None(),
      minimumSupportedRelease: '0.20.0',
      logoUrl: "https://cdn.activepieces.com/pieces/json.png",
      authors: [],
      actions: [convertJsonToText , convertTextToJson],
      triggers: [],
    });
    