import { PieceAuth } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { makeRequest } from "./client";

export const frontAuth = PieceAuth.SecretText({
    displayName: "Front API Key",
    description: `**Enter your Front API Key.**
---
### How to obtain your API key
1. Sign up / log in at [Front](https://frontapp.com/).
2. Go to **Settings > Developers**.
3. Go to the **API Tokens** tab.
4. Click **Create API token**.
5. Copy the **Token**.
6. Paste it here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (!auth) {
            return {
                valid: false,
                error: "API Key is required",
            };
        }

        try {
            await makeRequest(auth as string, HttpMethod.GET, "/me");
            return { valid: true };
        } catch (error) {
            return { valid: false, error: "Invalid Front API Key" };
        }
    },
});
