import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const PromptHubAuth = PieceAuth.SecretText({
    displayName: 'PromptHub API Key',
    description: `**Enter your PromptHub API Token.**
---
### How to obtain your API key
1. Log in to [PromptHub](https://www.prompthub.us/).
2. Go to **Account Settings > API Settings**.
3. Generate an API key.
4. Copy the API key and paste it here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                // Validate with the /me endpoint
                await makeRequest(auth as string, HttpMethod.GET, '/me');
                return {
                    valid: true,
                };
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid API Key',
                };
            }
        }
        return {
            valid: false,
            error: 'Invalid API Key',
        };
    },
});
