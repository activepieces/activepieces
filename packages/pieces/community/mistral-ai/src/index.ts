import { createPiece } from "@activepieces/pieces-framework";
import { createChatCompletion } from "./lib/actions/create-chat-completion";
import { createEmbeddings } from "./lib/actions/create-embeddings";
import { listModels } from "./lib/actions/list-models";
import { uploadFile } from "./lib/actions/upload-file";
import { mistralAiAuth } from "./lib/common/auth";

export const mistralAi = createPiece({
  displayName: "Mistral-ai",
  auth: mistralAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/mistral-ai.png",
  authors: ['Sanket6652'],
  actions: [createChatCompletion, createEmbeddings, listModels, uploadFile],
  triggers: [],
});
