import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { CognitoFormsApiError, cognitoRequest } from './common/client';

export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
1. Sign in to Cognito Forms as an organization owner or admin.
2. Click your organization's name in the top left corner, then click **Settings**.
3. Open **Integrations** and click **+ New API Key**.
4. Give the key the scopes you need (**Read** to look up forms and entries, **Write** to create or update entries, **Delete** to delete entries) and access to the forms you want to use.
5. Copy the key and paste it here. Cognito Forms only shows it once.

The Cognito Forms API needs a paid plan.
  `,
  validate: async ({ auth }) => {
    try {
      await cognitoRequest<unknown>({ apiKey: auth, method: HttpMethod.GET, path: '/forms' });
      return { valid: true };
    } catch (error) {
      if (error instanceof CognitoFormsApiError && error.status === 401) {
        return { valid: false, error: 'Invalid API key. Copy the key again from Organization Settings > Integrations.' };
      }
      if (error instanceof CognitoFormsApiError && error.status === 403) {
        return { valid: false, error: 'This API key cannot read forms. Give it the Read scope in Organization Settings > Integrations.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not verify the API key.' };
    }
  },
});
