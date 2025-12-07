
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { askAI } from './lib/actions/text/ask-ai';
import { summarizeText } from './lib/actions/text/summarize-text';


export const ai = createPiece({
  displayName: "AI",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.73.0',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  logoUrl: "https://cdn.activepieces.com/pieces/text-ai.svg",
  authors: ['anasbarg', 'amrdb'],
  actions: [askAI, summarizeText],
  triggers: [],
});
 

export * from './lib/common/types';
export * from './lib/common/props';
export * from './lib/common/ai-sdk';