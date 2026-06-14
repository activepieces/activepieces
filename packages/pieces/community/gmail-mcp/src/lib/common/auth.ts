import { PieceAuth } from '@activepieces/pieces-framework';

export const gmailMcpAuth = PieceAuth.OAuth2({
  description: 'Gmail OAuth2 authentication for MCP',
  authUrl: 'https://accounts.google.com/o/oauth2/auth',
  tokenUrl: 'https://oauth2.googleapis.com/token',
  required: true,
  scope: [
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.labels',
  ],
});

export type GmailMcpAuthValue = {
  access_token: string;
  refresh_token: string;
};
