import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownDescription = `
  Follow these instructions to get your Chargekeep API Key:

  1. Visit the following website: https://crm.chargekeep.com/ or the beta website: https://beta.chargekeep.com
  2. Once on the website, locate and click on the admin to obtain your chargekeep API Key.
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
});
