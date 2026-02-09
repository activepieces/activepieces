
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/shared';
import { askAI } from './lib/actions/text/ask-ai';
import { summarizeText } from './lib/actions/text/summarize-text';
import { generateImageAction } from "./lib/actions/image/generate-image";
import { classifyText } from "./lib/actions/utility/classify-text";
import { extractStructuredData } from "./lib/actions/utility/extract-structured-data";
import { runAgent } from "./lib/actions/agents/run-agent";


export const ai = createPiece({
  displayName: "AI",
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.75.0',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  logoUrl: "https://cdn.activepieces.com/pieces/text-ai.svg",
  authors: ['anasbarg', 'amrdb', 'Louai-Zokerburg'],
  actions: [askAI, summarizeText, generateImageAction, classifyText, extractStructuredData, runAgent],
  triggers: [],
});

export * from './lib/common/props';
export * from './lib/common/ai-sdk';