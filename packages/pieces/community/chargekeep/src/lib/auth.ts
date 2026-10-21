import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { ChargekeepApiError, chargekeepClient } from './common/client';

const markdownDescription = `
To get your ChargeKeep API key:

1. Sign in to https://crm.chargekeep.com (or https://beta.chargekeep.com) with an admin account.
2. Open the admin settings and find the API keys page.
3. Create a key and paste it below. Pick the Base URL of the site you signed in to.
`;

export const chargekeepAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    base_url: Property.StaticDropdown({
      displayName: 'Base URL',
      description: 'Select the base environment URL',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'ChargeKeep Live (crm.chargekeep.com)',
            value: 'https://crm.chargekeep.com',
          },
          {
            label: 'ChargeKeep Beta (beta.chargekeep.com)',
            value: 'https://beta.chargekeep.com',
          },
        ],
      },
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'Secret API Key',
      description: 'Enter the API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await chargekeepClient.request({ auth, method: HttpMethod.GET, path: '/api/services/CRM/Contact/GetContactGroups' });
      return { valid: true };
    } catch (error) {
      if (error instanceof ChargekeepApiError && (error.status === 401 || error.status === 403)) {
        return { valid: false, error: 'Invalid API key for the selected Base URL.' };
      }
      return { valid: false, error: error instanceof Error ? error.message : 'Could not reach ChargeKeep.' };
    }
  },
});
