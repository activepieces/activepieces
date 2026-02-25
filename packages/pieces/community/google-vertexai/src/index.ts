import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { vertexAiAuth } from "./lib/auth";
import { generateContent, rawRequest } from "./lib/actions";

export const googleVertexai = createPiece({
  displayName: "Google Vertex AI",
  description: "Generate content and make API requests using Gemini models on Google Vertex AI.",
  auth: vertexAiAuth,
  minimumSupportedRelease: "0.71.4",
  logoUrl: "https://cdn.activepieces.com/pieces/google-vertexai.png",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["activepieces"],
  actions: [generateContent, rawRequest],
  triggers: [],
});

export { vertexAiAuth, GoogleVertexAIAuthValue } from "./lib/auth";
