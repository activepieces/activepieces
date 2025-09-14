import { PieceAuth } from "@activepieces/pieces-framework";
import { makeRequest } from "./client";
import { HttpMethod } from "@activepieces/pieces-common";

export const vlmRunAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: "Enter your VLM-run API key.",
    required: true,

    validate: async ({ auth }) => {
        if (!auth) {
            return {
                valid: false,
                error: "API Key is required.",
            };
        }
        try {

            await makeRequest(auth as string, HttpMethod.GET, "/models");
            return {
                valid: true,
            };
        } catch (e: any) {
            return {
                valid: false,
                error: `Authentication failed: Invalid API Key.`,
            };
        }
    },
});