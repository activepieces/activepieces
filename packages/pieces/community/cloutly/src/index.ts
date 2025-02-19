
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { sendReviewInvite } from "./lib/actions/send-review-invite";

export const cloutlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Please enter the API Key obtain from Cloutly.',
});

export const cloutly = createPiece({
  displayName: "Cloutly Reviews",
  auth: cloutlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://app.cloutly.com/assets/images/icon-cloutly.svg",
  authors: ['joshuaheslin'],
  actions: [sendReviewInvite],
  triggers: [],
});