import { PieceAuth, createPiece } from "@activepieces/pieces-framework";
import { createCustomApiCallAction, httpClient, HttpMethod } from "@activepieces/pieces-common";
import { PieceCategory } from "@activepieces/shared";

import { extractFileData } from "./lib/actions/extract-file-data";
import { getExtractionResults } from "./lib/actions/get-extraction-results";
import { uploadFile } from "./lib/actions/upload-file";

import { extractionFailed } from "./lib/triggers/extraction-failed";
import { newDocumentProcessed } from "./lib/triggers/new-document-processed";

const API_BASE_URL = "https://api.extracta.ai/v1";

export const extractaAIAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: `
    To get your API key, please follow these steps:
    1. Sign up or log in to your account at [https://app.extracta.ai](https://app.extracta.ai).
    2. Navigate to the **API** page from your dashboard.
    3. Click on **"Generate a new API Key"**.
    4. Copy the generated API key and paste it here.
    `,
    required: true,
    validate: async ({ auth }) => {
        try {
            await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${API_BASE_URL}/me`,
                headers: {
                    'Authorization': `Bearer ${auth}`,
                }
            });
            return {
                valid: true,
            };
        } catch (e) {
            return {
                valid: false,
                error: 'Invalid API Key. Please check the key and try again.',
            };
        }
    }
});

export const extractaAi = createPiece({
    displayName: "Extracta AI",
    auth: extractaAIAuth,
    minimumSupportedRelease: '0.36.1',
    logoUrl: "https://cdn.activepieces.com/pieces/extracta-ai.png",
    categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
    authors: ['Pranith124'],
    actions: [
        extractFileData,
        uploadFile,
        getExtractionResults,
        createCustomApiCallAction({
            auth: extractaAIAuth,
            baseUrl: () => API_BASE_URL,
            authMapping: async (auth) => {
                return {
                    'Authorization': `Bearer ${auth as string}`,
                };
            },
        }),
    ],
    triggers: [
        newDocumentProcessed,
        extractionFailed
    ],
});