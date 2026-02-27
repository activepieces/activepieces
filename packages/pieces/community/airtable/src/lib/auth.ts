import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const airtableAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  required: true,
  description: `
    To obtain your personal token, follow these steps:

    1. Log in to your Airtable account.
    2. Visit https://airtable.com/create/tokens/ to create one
    3. Click on "+ Add a base" and select the base you want to use or all bases.
    4. Click on "+ Add a scope" and select "data.records.read", "data.records.write" and "schema.bases.read".
    5. Click on "Create token" and copy the token.
    `,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.airtable.com/v0/meta/bases',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid personal access token',
      };
    }
  },
});
