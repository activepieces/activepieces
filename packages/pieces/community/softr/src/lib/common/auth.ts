import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const SoftrAuth = PieceAuth.SecretText({
  displayName: 'Softr API Key',
  description: `**Enter your Softr API Key.**
---
### How to obtain your API key
1. Log in to your Softr account at [softr.io](https://softr.io).
2. Navigate to your app settings.
3. Go to the **API** section.
4. Generate or copy your API key.
5. Paste the API key here.

For more details, visit the [Softr API documentation](https://docs.softr.io/softr-api/tTFQ5vSAUozj5MsKixMH8C/api-setup-and-endpoints/j1PrTZxt7pv3iZCnZ5Fp19).
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth as string, HttpMethod.GET, '/databases');
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
