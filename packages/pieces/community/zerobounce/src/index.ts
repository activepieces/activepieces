
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { validateEmail } from "./lib/actions/validate-email";

export const zerobounceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

export const zerobounce = createPiece({
  displayName: "ZeroBounce",
  auth: zerobounceAuth,
  description: "ZeroBounce is an email validation service that helps you reduce bounces, improve email deliverability and increase email marketing ROI.",
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/zerobounce.png",
  authors: ["abuaboud"],
  actions: [validateEmail],
  triggers: [],
});
