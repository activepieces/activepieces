import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const FathomAuth = PieceAuth.SecretText({
    displayName: 'Fathom API Key',
    description: `**Enter your Fathom API Key.**`,
    required: true,


    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/teams');
                return { valid: true };
            } catch (error) {
                return { valid: false, error: 'Invalid API Key or insufficient permissions' };
            }
        }
        return { valid: false, error: 'API Key is required' };
    },
});
