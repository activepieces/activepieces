
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { baseUrl, unauthorizedMessage } from "./lib/common/common";
import OpenAI from 'openai';
import { askDeepseek } from "./lib/actions/ask-deepseek";
import { PieceCategory } from "@activepieces/shared";
import { deepseekAuth } from './lib/auth';

        
    export const deepseek = createPiece({
      displayName: "DeepSeek",
      auth: deepseekAuth,
      categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
      minimumSupportedRelease: '0.36.1',
      logoUrl: "https://cdn.activepieces.com/pieces/deepseek.png",
      authors: ["PFernandez98"],
      actions: [askDeepseek],
      triggers: [],
    });
    