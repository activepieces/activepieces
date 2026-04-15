import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { OutsetaClient } from './common/client';

export const outsetaAuth = PieceAuth.CustomAuth({
  displayName: 'Outseta Admin API',
  description: `Connect Activepieces to your Outseta account using the Admin API.

**To get your credentials:**
1. Log in to your Outseta account
2. Go to **Settings → Integrations → API**
3. Copy your **API Key** and **API Secret**
4. Your domain is your Outseta subdomain, e.g. \`https://yourcompany.outseta.com\`

Need help? See [Outseta API docs](https://documenter.getpostman.com/view/3613332/outseta-rest-api-v1).`,
  required: true,
  props: {
    domain: Property.ShortText({
      displayName: 'Outseta Domain',
      description:
        'Your full Outseta domain URL, e.g. https://yourcompany.outseta.com',
      required: true,
    }),
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Found in Outseta → Settings → Integrations → API',
      required: true,
    }),
    apiSecret: Property.ShortText({
      displayName: 'API Secret',
      description:
        'Found alongside your API Key in Outseta → Settings → Integrations → API',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    if (auth) {
      try {
        const client = new OutsetaClient({
          domain: auth.domain,
          apiKey: auth.apiKey,
          apiSecret: auth.apiSecret,
        });

        await client.get<any>(`/api/v1/crm/people?$top=1`);

        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key or secret key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
