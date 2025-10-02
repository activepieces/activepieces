import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const SenderAuth = PieceAuth.SecretText({
    displayName: 'Sender API Key',
    description: `**Enter your Sender API access token.**
---
### How to obtain your API key
1. Log in to your [Sender account](https://app.sender.net/).
2. Go to **Settings → API access tokens**.
3. Click **Generate Token**.
4. Copy the API key and paste it here.`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                await makeRequest(auth as string, HttpMethod.GET, "/groups");
                return { valid: true };
            } catch (error) {
                return {
                    valid: false,
                    error: "Invalid API Key",
                };
            }
        }
        return {
            valid: false,
            error: "API Key is required",
        };
    },
});
