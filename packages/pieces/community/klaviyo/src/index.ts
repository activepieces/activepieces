import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";
import { createProfile } from "./lib/actions/create-profile";

export const klaviyoAuth = PieceAuth.SecretText({
    displayName: 'Secret API Key',
    description: 'Enter your Klaviyo Private API Key',
    required: true,
});

export const klaviyo = createPiece({
    displayName: "Klaviyo",
    description: "Marketing automation platform.",
    auth: klaviyoAuth,
    minimumSupportedRelease: '0.30.0',
    logoUrl: "https://cdn.activepieces.com/pieces/klaviyo.png",
    authors: [],
    categories: [PieceCategory.MARKETING],
    actions: [createProfile],
    triggers: [],
});
