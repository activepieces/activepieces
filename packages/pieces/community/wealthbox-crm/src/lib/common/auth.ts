import { PieceAuth, OAuth2Property } from '@activepieces/pieces-framework';

export const wealthboxCrmAuth = PieceAuth.OAuth2({
  authUrl: 'https://app.crmworkspace.com/oauth/authorize',
  tokenUrl: 'https://app.crmworkspace.com/oauth/token',
  scope: ['login', 'data'],
  extra: {
    prompt: 'consent',
  },
});
