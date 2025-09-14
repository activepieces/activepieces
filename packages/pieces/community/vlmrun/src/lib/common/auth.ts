// auth.ts (or wherever you define it)

import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const VlmRunAuth = PieceAuth.SecretText({
    displayName: 'VLM Run API Key',
    description: `**Enter your VLM Run API Key.**
---
### How to obtain your API key
1. Sign up / Log in to [VLM Run](https://vlm.run/)
2. Go to Dashboard → Settings → API Keys
3. Copy the API key and paste here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (!auth) {
            return {
                valid: false,
                error: 'API Key is required',
            };
        }
        try {
            await makeRequest(auth as string, HttpMethod.GET, `/files`);
            return {
                valid: true,
            };
        } catch (error: any) {
            return {
                valid: false,
                error: 'Invalid VLM Run API Key',
            };
        }
    },
});
