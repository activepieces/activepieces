import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createChatCompletion } from "./lib/actions/create-chat-completion";
import { createEmbeddings } from "./lib/actions/create-embeddings";
import { uploadFile } from "./lib/actions/upload-file";
import { listModels } from "./lib/actions/list-models";
import { mistralAuth } from "./lib/common/auth";
import { customApiCall } from "./lib/actions/custom-api-call";

export const mistralAi = createPiece({
  displayName: "Mistral AI",
  description: "Mistral AI provides state-of-the-art open-weight and hosted language models for text generation, embeddings, and reasoning tasks.",
  auth: mistralAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://cdn.activepieces.com/pieces/mistral-ai.png",
  authors: ["sparkybug"],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createChatCompletion,
    createEmbeddings,
    uploadFile,
    listModels,
    customApiCall,
  ],
  triggers: [],
});
    