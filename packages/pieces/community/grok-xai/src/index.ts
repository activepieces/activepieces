import { createPiece } from "@activepieces/pieces-framework";
import { askGrok } from './lib/actions/ask-grok';
import { generateImage } from './lib/actions/generate-image';
import { extractDataFromText } from './lib/actions/extract-data-from-text';
import { categorizeText } from './lib/actions/categorize-text';
import { grokAuth } from "./lib/auth";

export const grok = createPiece({
  displayName: "Grok xAI",
  description: "Grok xAI is an AI-powered tool for understanding and generating text",
  auth: grokAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/grok-xai.png",
  authors: ['stefansarya'],
  actions: [askGrok, generateImage, extractDataFromText, categorizeText],
  triggers: [],
});