import { PieceAuth, Property } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const SocialKitAuth = PieceAuth.SecretText({
    displayName: 'SocialKit API Key',
    description: `**Enter your SocialKit Access Key.**
---
### How to obtain your API key
1. Visit [socialkit.dev](https://www.socialkit.dev) and sign up or log in.
2. Go to your **Dashboard**.
3. Copy your **Access Key**.
4. Paste it here to connect your account.
`,
    required: true,

    validate: async ({ auth }) => {
        if (auth) {
            try {
                // Simple test request to validate the API key
                await makeRequest(auth as string, HttpMethod.GET, '/status');
                return { valid: true };
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid API Key. Please verify your SocialKit Access Key.'
                };
            }
        }
        return {
            valid: false,
            error: 'Missing API Key.'
        };
    },
});
