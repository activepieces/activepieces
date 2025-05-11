import { createPiece, OAuth2PropertyValue, PieceAuth, Property } from "@activepieces/pieces-framework";
import { PieceCategory } from "@activepieces/shared";

export const pcloudAuth = PieceAuth.OAuth2({
  description: 'OAuth2 authentication for pCloud',
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: ['fileops', 'readwrite'],
});

export const pcloud = createPiece({
  displayName: "pCloud",
  auth: pcloudAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/pcloud.png",
  categories: [PieceCategory.CONTENT_AND_FILES],
  authors: ["cloudcomm"],
  actions: [],
  triggers: [],
});
