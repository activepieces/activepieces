import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const SlideSpeakAuth = PieceAuth.SecretText({
    displayName: 'SlideSpeak API Key',
    description: `**Enter your SlideSpeak API Key.**
---
### How to obtain your API key
1. Sign up or log in at [SlideSpeak](https://slidespeak.co).
2. Go to your **Account / API Keys** section.
3. Generate a new API key.
4. Copy and paste it here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
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
