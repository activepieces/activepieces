import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const createIntegration = createAction({
  auth: villageAuth,
  name: 'create_integration',
  displayName: 'Create Gmail Integration',
  description:
    'Connect a Gmail account for sending email sequences by providing the Google OAuth credentials (access token, optional refresh token, scopes). Fails with 409 if a full Gmail integration already exists for the account.',
  props: {
    account_identifier: Property.ShortText({
      displayName: 'Account Identifier',
      description: 'Google account identifier, e.g. "google:123456789012345678"',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Gmail email address',
      required: true,
    }),
    access_token: Property.ShortText({
      displayName: 'Access Token',
      description: 'Google OAuth access token (e.g. ya29.a0AfH6SMC...)',
      required: true,
    }),
    refresh_token: Property.ShortText({
      displayName: 'Refresh Token',
      description: 'Google OAuth refresh token (optional)',
      required: false,
    }),
    scope: Property.ShortText({
      displayName: 'OAuth Scope',
      description:
        'Space-delimited OAuth scopes granted, e.g. "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.readonly"',
      required: true,
    }),
    data_scope: Property.Array({
      displayName: 'Data Scope',
      description: 'Data scopes for the integration, e.g. ["email", "contacts", "calendar"]',
      required: true,
      defaultValue: [],
    }),
  },
  async run(context) {
    const {
      account_identifier,
      email,
      access_token,
      refresh_token,
      scope,
      data_scope,
    } = context.propsValue;

    const authenticationTokenData: Record<string, string> = {
      access_token,
      scope,
    };
    if (refresh_token) {
      authenticationTokenData['refresh_token'] = refresh_token;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/integrations`,
      headers: { Authorization: `Bearer ${context.auth}` },
      body: {
        google_integration_properties: {
          account_identifier,
          email,
          authentication_token_data: authenticationTokenData,
          type: 'google',
          data_scope: (data_scope ?? []).map(String),
          authorized_gmail: true,
          sync_data: { email },
        },
      },
    });
    return response.body;
  },
});
