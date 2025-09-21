import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const CapsuleCRMAuth = PieceAuth.SecretText({
    displayName: 'Capsule CRM Personal Access Token',
    description: `**Enter your Capsule CRM Personal Access Token.**
---
### How to obtain your token
1. Log in to your Capsule account.
2. Click on your profile avatar → **My Preferences**.
3. Select **API Authentication Tokens**.
4. Generate a new token and paste it here.
`,
    required: true,
    validate: async ({ auth }) => {
        if (auth) {
            try {
                // Test with "Get Current User" endpoint
                await makeRequest(auth as string, HttpMethod.GET, '/users/current');
                return {
                    valid: true,
                };
            } catch (error) {
                return {
                    valid: false,
                    error: 'Invalid Capsule CRM Personal Access Token',
                };
            }
        }
        return {
            valid: false,
            error: 'Missing Capsule CRM Personal Access Token',
        };
    },
});
