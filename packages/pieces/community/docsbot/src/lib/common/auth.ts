import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const DocsBotAuth = PieceAuth.SecretText({
    displayName: "DocsBot AI API Key",
    description: `Enter your DocsBot API key.
---
### How to obtain:
1. Sign in at https://docsbot.ai/
2. Navigate to **API Keys** in dashboard
3. Copy your key and paste here.`,
    required: true,
    validate: async ({ auth }) => {
        if (!auth) {
            return { valid: false, error: "API Key is required" };
        }
        try {
      
            await makeRequest(auth as string, HttpMethod.GET, "/api/teams/");
            return { valid: true };
        } catch {
            return { valid: false, error: "Invalid API Key" };
        }
    },
});
