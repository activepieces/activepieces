import { PieceAuth, Property } from "@activepieces/pieces-framework";

import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./client";

export const PineconeAuth = PieceAuth.SecretText({
    displayName: 'Pinecone API Key',
    description: `
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, '/teams', {});
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