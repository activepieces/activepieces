import {
  createPiece,
  OAuth2PropertyValue,
  PieceAuth,
} from '@activepieces/pieces-framework';

import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { newResponse } from './lib/triggers/new-response';

const smAuthDescription = `
To connect SurveyMonkey, create your own app:
1. Go to https://developer.surveymonkey.com/apps/ and click **Add a New App**.
2. On the app's **Settings** tab, set the **OAuth Redirect URL** to the redirect URL shown above.
3. Under **Scopes**, set these to **Required** and click **Update Scopes**: View Surveys, View Responses, View Response Details, View Webhooks, Create/Modify Webhooks, View Users.
4. Copy the **Client ID** and **Secret** from the **Credentials** section and paste them above.

A new app starts as a draft that only your own SurveyMonkey account can connect, for 90 days. To keep using it, deploy it as **Private** (needs a paid plan) or **Public** (needs SurveyMonkey review).
`;

export const smAuth = PieceAuth.OAuth2({
  description: smAuthDescription,
  authUrl: 'https://api.surveymonkey.com/oauth/authorize',
  tokenUrl: 'https://api.surveymonkey.com/oauth/token',
  required: true,
  prompt: 'omit',
  extra: { access_type: '' },
  scope: [
    'responses_read',
    'responses_read_detail',
    'webhooks_read',
    'webhooks_write',
    'surveys_read',
    'users_read',
  ],
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ email?: string; username?: string }>({
        method: HttpMethod.GET,
        url: 'https://api.surveymonkey.com/v3/users/me',
        headers: { Authorization: `Bearer ${auth.access_token}` },
        timeout: 5000,
      });
      return response.body.email || response.body.username || undefined;
    } catch {
      return undefined;
    }
  },
});

export const surveymonkey = createPiece({
  displayName: 'SurveyMonkey',
  description: 'Receive survey responses from SurveyMonkey',
  auth: smAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/surveymonkey.png',
  categories: [PieceCategory.FORMS_AND_SURVEYS],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://api.surveymonkey.com/v3',
      auth: smAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [newResponse],
});
