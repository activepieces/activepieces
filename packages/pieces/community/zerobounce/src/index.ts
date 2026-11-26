
import { createPiece, PieceAuth } from "@activepieces/pieces-framework";
import { validateEmail } from "./lib/actions/validate-email";

export const zerobounceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to [ZeroBounce](https://www.zerobounce.net/members/signin).
2. Click **API** in the dashboard menu.
3. Copy your key, or create one with **+ Create a new API Key**.`,
  required: true,
});

export const zerobounce = createPiece({
  displayName: "ZeroBounce",
  auth: zerobounceAuth,
  description: "Validate email addresses to reduce bounces and improve deliverability.",
  minimumSupportedRelease: '0.30.0',
  logoUrl: "https://cdn.activepieces.com/pieces/zerobounce.png",
  authors: ["abuaboud"],
  actions: [validateEmail],
  triggers: [],
});
