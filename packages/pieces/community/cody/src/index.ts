import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createDocumentFromText } from "./lib/actions/create-document-from-text";
import { uploadFileAction } from "./lib/actions/upload-file";
import { sendMessageAction } from "./lib/actions/send-message";
import { createConversationAction } from "./lib/actions/create-conversation";
import { findBotAction } from "./lib/actions/find-bot";
import { findConversationAction } from "./lib/actions/find-conversation";
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { codyClient } from "./lib/common/client";

// Define the authentication property using PieceAuth.SecretText
// This will create a secure text input field in the UI for the user's API key.
export const codyAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `Visit your Cody AI API Keys page to retrieve the API key.`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await codyClient.listBots(auth);
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
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/cody.png",
    authors: [ 'Pranith124','sanket-a11y' ],
    actions: [
        createDocumentFromText,
        uploadFileAction,
        sendMessageAction,
        createConversationAction,
        findBotAction,
        findConversationAction,
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