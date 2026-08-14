import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createDocumentFromText } from "./lib/actions/create-document-from-text";
import { uploadFileAction } from "./lib/actions/upload-file";
import { sendMessageAction } from "./lib/actions/send-message";
import { createConversationAction } from "./lib/actions/create-conversation";
import { findBotAction } from "./lib/actions/find-bot";
import { findConversationAction } from "./lib/actions/find-conversation";
import { listBotsAction } from "./lib/actions/list-bots";
import { createConversationAiAction } from "./lib/actions/create-conversation-ai";
import { sendMessageAiAction } from "./lib/actions/send-message-ai";
import { listConversationsAction } from "./lib/actions/list-conversations";
import { createTextDocumentAction } from "./lib/actions/create-text-document";
import { uploadFileToKbAction } from "./lib/actions/upload-file-to-kb";
import { getConversationAction } from "./lib/actions/get-conversation";
import { updateConversationAction } from "./lib/actions/update-conversation";
import { deleteConversationAction } from "./lib/actions/delete-conversation";
import { listMessagesAction } from "./lib/actions/list-messages";
import { getMessageAction } from "./lib/actions/get-message";
import { listFoldersAction } from "./lib/actions/list-folders";
import { getFolderAction } from "./lib/actions/get-folder";
import { createFolderAction } from "./lib/actions/create-folder";
import { renameFolderAction } from "./lib/actions/rename-folder";
import { listDocumentsAction } from "./lib/actions/list-documents";
import { createDocumentFromWebpageAction } from "./lib/actions/create-document-from-webpage";
import { getDocumentAction } from "./lib/actions/get-document";
import { deleteDocumentAction } from "./lib/actions/delete-document";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { codyClient } from "./lib/common/client";
import { AppConnectionType } from '@activepieces/pieces-framework';

// Define the authentication property using PieceAuth.SecretText
// This will create a secure text input field in the UI for the user's API key.
export const codyAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `Visit your Cody AI API Keys page to retrieve the API key.`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await codyClient.listBots({
                    secret_text: auth,
                    type: AppConnectionType.SECRET_TEXT,
                });
                return {
                    valid: true,
                }
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid Api Key'
                }
            }

        }
        return {
            valid: false,
            error: 'Invalid Api Key'
        }

    },
});

export const cody = createPiece({
    displayName: "Cody",
    auth: codyAuth,
    minimumSupportedRelease: '0.86.4',
    logoUrl: "https://cdn.activepieces.com/pieces/cody.png",
    authors: [ 'Pranith124','sanket-a11y' ],
    actions: [
        createDocumentFromText,
        uploadFileAction,
        sendMessageAction,
        createConversationAction,
        findBotAction,
        findConversationAction,
        listBotsAction,
        createConversationAiAction,
        sendMessageAiAction,
        listConversationsAction,
        createTextDocumentAction,
        uploadFileToKbAction,
        getConversationAction,
        updateConversationAction,
        deleteConversationAction,
        listMessagesAction,
        getMessageAction,
        listFoldersAction,
        getFolderAction,
        createFolderAction,
        renameFolderAction,
        listDocumentsAction,
        createDocumentFromWebpageAction,
        getDocumentAction,
        deleteDocumentAction,
        createCustomApiCallAction({
              auth: codyAuth,
              baseUrl: () => 'https://getcody.ai/api/v1',
              authMapping: async (auth) => ({
                Authorization: `Bearer ${auth}`,
              }),
            }),
      ],
    triggers: [
        // Your triggers will go here
    ],
});