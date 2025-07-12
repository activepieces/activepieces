import { PieceAuth } from "@activepieces/pieces-framework";


export const pinterestAuth = PieceAuth.OAuth2({
  description: 'Connect your Pinterest Business Account',
  authUrl: 'https://www.pinterest.com/oauth/',
  tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
  required: true,
  scope: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
});
