import { createPiece } from "@activepieces/pieces-framework";
import { PieceCategory } from '@activepieces/pieces-framework';
import { createChatCompletion } from "./lib/actions/create-chat-completion";
import { createEmbeddings } from "./lib/actions/create-embeddings";
import { uploadFile } from "./lib/actions/upload-file";
import { runOcr } from "./lib/actions/run-ocr";
import { listModels } from "./lib/actions/list-models";
import { generateChatCompletion } from "./lib/actions/generate-chat-completion";
import { completeCodeFim } from "./lib/actions/complete-code-fim";
import { transcribeAudio } from "./lib/actions/transcribe-audio";
import { generateSpeech } from "./lib/actions/generate-speech";
import { moderateText } from "./lib/actions/moderate-text";
import { moderateChat } from "./lib/actions/moderate-chat";
import { getModel } from "./lib/actions/get-model";
import { listFiles } from "./lib/actions/list-files";
import { getFile } from "./lib/actions/get-file";
import { deleteFile } from "./lib/actions/delete-file";
import { getFileSignedUrl } from "./lib/actions/get-file-signed-url";
import { downloadFile } from "./lib/actions/download-file";
import { createAgent } from "./lib/actions/create-agent";
import { listAgents } from "./lib/actions/list-agents";
import { getAgent } from "./lib/actions/get-agent";
import { updateAgent } from "./lib/actions/update-agent";
import { deleteAgent } from "./lib/actions/delete-agent";
import { startConversation } from "./lib/actions/start-conversation";
import { appendToConversation } from "./lib/actions/append-to-conversation";
import { restartConversation } from "./lib/actions/restart-conversation";
import { listConversations } from "./lib/actions/list-conversations";
import { getConversation } from "./lib/actions/get-conversation";
import { getConversationHistory } from "./lib/actions/get-conversation-history";
import { getConversationMessages } from "./lib/actions/get-conversation-messages";
import { deleteConversation } from "./lib/actions/delete-conversation";
import { createLibrary } from "./lib/actions/create-library";
import { listLibraries } from "./lib/actions/list-libraries";
import { getLibrary } from "./lib/actions/get-library";
import { updateLibrary } from "./lib/actions/update-library";
import { deleteLibrary } from "./lib/actions/delete-library";
import { uploadLibraryDocument } from "./lib/actions/upload-library-document";
import { listLibraryDocuments } from "./lib/actions/list-library-documents";
import { getLibraryDocument } from "./lib/actions/get-library-document";
import { updateLibraryDocument } from "./lib/actions/update-library-document";
import { deleteLibraryDocument } from "./lib/actions/delete-library-document";
import { getDocumentStatus } from "./lib/actions/get-document-status";
import { getDocumentTextContent } from "./lib/actions/get-document-text-content";
import { reprocessDocument } from "./lib/actions/reprocess-document";
import { listBatchJobs } from "./lib/actions/list-batch-jobs";
import { createBatchJob } from "./lib/actions/create-batch-job";
import { getBatchJob } from "./lib/actions/get-batch-job";
import { cancelBatchJob } from "./lib/actions/cancel-batch-job";
import { mistralAuth } from "./lib/common/auth";
import { mistralRequest } from "./lib/common/request";
import { createCustomApiCallAction } from "@activepieces/pieces-common";

export const mistralAi = createPiece({
  displayName: "Mistral AI",
  description: "Mistral AI provides state-of-the-art open-weight and hosted language models for text generation, embeddings, and reasoning tasks.",
  auth: mistralAuth,
  minimumSupportedRelease: "0.87.0",
  logoUrl: "https://cdn.activepieces.com/pieces/mistral-ai.png",
  authors: ["sparkybug"],
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  actions: [
    createChatCompletion,
    createEmbeddings,
    uploadFile,
    runOcr,
    listModels,
    generateChatCompletion,
    completeCodeFim,
    transcribeAudio,
    generateSpeech,
    moderateText,
    moderateChat,
    getModel,
    listFiles,
    getFile,
    deleteFile,
    getFileSignedUrl,
    downloadFile,
    createAgent,
    listAgents,
    getAgent,
    updateAgent,
    deleteAgent,
    startConversation,
    appendToConversation,
    restartConversation,
    listConversations,
    getConversation,
    getConversationHistory,
    getConversationMessages,
    deleteConversation,
    createLibrary,
    listLibraries,
    getLibrary,
    updateLibrary,
    deleteLibrary,
    uploadLibraryDocument,
    listLibraryDocuments,
    getLibraryDocument,
    updateLibraryDocument,
    deleteLibraryDocument,
    getDocumentStatus,
    getDocumentTextContent,
    reprocessDocument,
    listBatchJobs,
    createBatchJob,
    getBatchJob,
    cancelBatchJob,
    createCustomApiCallAction({
      auth: mistralAuth,
      baseUrl: (auth) => (auth ? mistralRequest.getConfig(auth).baseUrl : 'https://api.mistral.ai/v1'),
      authMapping: async (auth) => mistralRequest.getConfig(auth).headers,
    }),
  ],
  triggers: [],
});
