import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const ChatDataAuth = PieceAuth.SecretText({
    displayName: 'Chat Data API Key',
    description: `**Enter your Chat Data API Key (Bearer token).**`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/get-chatbots');
                return {
                    valid: true,
                }
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid API Key'
                }
            }
        }
        return {
            valid: false,
            error: 'Invalid API Key'
        }
    },
});
