import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { documentQuestionAnswering } from "./lib/actions/document-question-answering";
import { languageTranslation } from "./lib/actions/language-translation";
import { textClassification } from "./lib/actions/text-classification";
import { textSummarization } from "./lib/actions/text-summarization";
import { chatCompletion } from "./lib/actions/chat-completion";
import { createImage } from "./lib/actions/create-image";
import { objectDetection } from "./lib/actions/object-detection";
import { imageClassification } from "./lib/actions/image-classification";

export const huggingFaceAuth = PieceAuth.OAuth2({
  description: "Authentication for Hugging Face Hub",
  authUrl: "https://huggingface.co/oauth/authorize",
  tokenUrl: "https://huggingface.co/oauth/token",
  required: true,
  scope: []
});

export const huggingface = createPiece({
  displayName: "Hugging Face",
  description: "Run inference on 100,000+ open ML models for NLP, vision, and audio tasks",
  auth: huggingFaceAuth,
  logoUrl: "https://cdn.activepieces.com/pieces/huggingface.svg",
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["Ani-4x"],
  actions: [
    documentQuestionAnswering,
    languageTranslation,
    textClassification,
    textSummarization,
    chatCompletion,
    createImage,
    objectDetection,
    imageClassification,
  ],
  triggers: [],
});