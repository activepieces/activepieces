import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createChatCompletion } from "./lib/actions/create-chat-completion";
import { createEmbeddings } from "./lib/actions/create-embeddings";
import { uploadFile } from "./lib/actions/upload-file";
import { runOcr } from "./lib/actions/run-ocr";
import { listModels } from "./lib/actions/list-models";
import { mistralAuth } from "./lib/common/auth";
import { mistralRequest } from "./lib/common/request";
import { createCustomApiCallAction } from "@activepieces/pieces-common";

export const mistralAi = createPiece({
  displayName: "Mistral AI",
  description: "Mistral AI provides state-of-the-art open-weight and hosted language models for text generation, embeddings, and reasoning tasks.",
  auth: mistralAuth,
  minimumSupportedRelease: "0.36.1",
  logoUrl: "https://cdn.activepieces.com/pieces/mistral-ai.png",
  authors: ["sparkybug"],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createChatCompletion,
    createEmbeddings,
    uploadFile,
    runOcr,
    listModels,
    createCustomApiCallAction({
      auth: mistralAuth,
      baseUrl: (auth) => (auth ? mistralRequest.getConfig(auth).baseUrl : 'https://api.mistral.ai/v1'),
      authMapping: async (auth) => mistralRequest.getConfig(auth).headers,
    }),
  ],
  triggers: [],
});
