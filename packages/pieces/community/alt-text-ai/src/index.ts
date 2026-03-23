
    import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { generateAltTextAction } from "./lib/actions/generate-alt-text";
import { createCustomApiCallAction } from "@activepieces/pieces-common";
import { altTextAiAuth } from "./lib/common/auth";
import { BASE_URL } from "./lib/common/constants";
import { PieceCategory } from "@activepieces/shared";

    export const altTextAi = createPiece({
      displayName: "AltText.ai",
      categories:[PieceCategory.ARTIFICIAL_INTELLIGENCE],
      auth: altTextAiAuth,
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/alt-text-ai.png",
      authors: ['kishanprmr'],
      actions: [generateAltTextAction,
        createCustomApiCallAction({
          auth:altTextAiAuth,
          baseUrl:()=>BASE_URL,
          authMapping:async (auth)=>{
            return{
              'X-API-Key':auth.secret_text
            }
          }
        })
      ],
      triggers: [],
    });
    