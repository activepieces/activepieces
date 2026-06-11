
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
  // The run-agent thin shell needs context.agent.run/continueRun (worker-side agent loop), which
  // first ships in 0.86.0 — older platforms must keep serving the previous in-sandbox piece version.
  minimumSupportedRelease: '0.86.0',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  logoUrl: "https://cdn.activepieces.com/pieces/new-core/text-ai.svg",
  authors: ['anasbarg', 'amrdb', 'Louai-Zokerburg'],
  actions: [askAI, summarizeText, generateImageAction, classifyText, extractStructuredData, runAgent],
  triggers: [],
});

export * from './lib/common/props';
export * from './lib/common/ai-sdk';