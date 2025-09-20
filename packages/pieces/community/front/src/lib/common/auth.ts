import { PieceAuth } from '@activepieces/pieces-framework';

export const frontAuth = PieceAuth.OAuth2({
  description: 'Connect your Front account',
  authUrl: 'https://app.frontapp.com/oauth/authorize',
  tokenUrl: 'https://app.frontapp.com/oauth/token',
  required: true,
  scope: [
    'private',
    'shared',
    'workspace',
    'knowledge_base',
    'provisioning',
    'auto_provisioning',
    'application_triggers',
  ],
});
