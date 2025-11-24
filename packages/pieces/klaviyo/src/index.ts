import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common"; // <--- ADDED IMPORT
import { klaviyoCommon } from "./lib/common";
import { createProfileAction } from "./lib/actions/create-profile";

export const klaviyoAuth = PieceAuth.SecretText({
    displayName: "Private API Key",
    required: true,
    description: "Your Klaviyo Private API Key (pk_...)",
    validate: async ({ auth }) => {
        try {
            // CHANGED "GET" TO HttpMethod.GET
            await klaviyoCommon.makeRequest(HttpMethod.GET, "/accounts", auth);
            return { valid: true };
        } catch (e) {
            return { valid: false, error: "Invalid API Key. Ensure it is a Private Key (pk_...)" };
        }
    }
});

export const klaviyo = createPiece({
    displayName: "Klaviyo",
    auth: klaviyoAuth,
    minimumSupportedRelease: "0.20.0",
    logoUrl: "https://cdn.activepieces.com/pieces/klaviyo.png",
    authors: ["TheArchitect"],
    actions: [
        createProfileAction,
    ],
    triggers: [],
});