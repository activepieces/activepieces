import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

import { sendPrompt } from "./lib/actions/send-prompt";
import { createParaphrase } from "./lib/actions/create-paraphrase";
import { createSocialMediaCaption } from "./lib/actions/create-social-media-caption";
import { createTranslation } from "./lib/actions/create-translation";
import { createCode } from "./lib/actions/create-code";
import { createEmail } from "./lib/actions/create-email";
import { createProductDescription } from "./lib/actions/create-product-description";
import { createSummary } from "./lib/actions/create-summary";

export const textcortexAi = createPiece({
  displayName: "TextCortex AI",
  // The API uses a Bearer Token, so we use SecretText authentication.
  // This will prompt the user for their API key when they add a connection.
  auth: PieceAuth.SecretText({
    displayName: "API Key",
    description: "Get your API key from your TextCortex account settings.",
    required: true,
  }),
  minimumSupportedRelease: '0.20.0',
  logoUrl: "https://cdn.activepieces.com/pieces/textcortex-ai.png",
  authors: [
  ],
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.MARKETING,
  ],
  actions: [
    sendPrompt,
    createParaphrase,
    createSocialMediaCaption,
    createTranslation,
    createCode,
    createEmail,
    createProductDescription,
    createSummary,
  ], 
  triggers: [],
});