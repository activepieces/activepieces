import { PieceAuth } from "@activepieces/pieces-framework";

export const pcloudAuth = PieceAuth.OAuth2({
  description: "Authenticate with your pCloud account",
  authUrl: "https://my.pcloud.com/oauth2/authorize",
  tokenUrl: "https://api.pcloud.com/oauth2_token",
  required: true,
  scope: [],
});
