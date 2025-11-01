import { PieceAuth } from "@activepieces/pieces-framework";

export const myCaseAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://auth.mycase.com/login_sessions/new',
  tokenUrl: 'https://auth.mycase.com/tokens',
  required: true,
  scope: [],
});