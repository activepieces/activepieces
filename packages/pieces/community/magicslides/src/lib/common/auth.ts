import { PieceAuth } from "@activepieces/pieces-framework";

export const magicslidesAuth = PieceAuth.SecretText({
    displayName: "Access ID",
    description: "Your MagicSlides API Access ID. You can find this in your MagicSlides dashboard under API Settings.",
    required: true,
});