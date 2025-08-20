import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const RetllAiAuth = PieceAuth.SecretText({
    displayName: 'Retell Ai API Key',
    description: `
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/list-chat');
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

})