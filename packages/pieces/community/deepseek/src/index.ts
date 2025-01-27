
import { AI_PROVIDERS_MAKRDOWN } from "@activepieces/pieces-common";
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { baseUrl, unauthorizedMessage } from "./lib/common/common";
import OpenAI from 'openai';
import { askDeepseek } from "./lib/actions/ask-deepseek";
import { PieceCategory } from "@activepieces/shared";

    export const deepseekAuth = PieceAuth.SecretText({
      description: AI_PROVIDERS_MAKRDOWN.deepseek,
      displayName: 'API Key',
      required: true,
      validate: async (auth) => {
        try {
          const openai = new OpenAI({
            baseURL: baseUrl,
            apiKey: auth.auth,
          });

          const models = await openai.models.list();
          if (models.data.length > 0){
            return {
              valid: true,
            };
          }
          else
          return {
            valid: false,
            error: unauthorizedMessage,
          };
        } catch (e) {
          return {
            valid: false,
            error: unauthorizedMessage,
          };
        }
      },
    });
    
    export const deepseek = createPiece({
      displayName: "Deepseek",
      auth: deepseekAuth,
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/deepseek.png",
      authors: ["PFernandez98"],
      actions: [askDeepseek],
      triggers: [],
    });
    