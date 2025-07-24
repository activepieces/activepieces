import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const browseAiAuth = PieceAuth.SecretText({
    displayName: 'Browse AI API Key',
    description: `
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/status ', {});
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