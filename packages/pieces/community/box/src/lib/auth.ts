import { PieceAuth } from '@activepieces/pieces-framework';

export const boxAuth = PieceAuth.OAuth2({
  required: true,
  authUrl: 'https://account.box.com/api/oauth2/authorize',
  tokenUrl: 'https://api.box.com/oauth2/token',
  scope: [
    'manage_webhook',
    'root_readonly',
    'root_readwrite',
    'manage_managed_users',
    'manage_groups',
    'manage_enterprise_properties',
    'manage_data_retention',
    'manage_triggers',
    'sign_requests.readwrite',
    'ai.readwrite',
  ],
});
