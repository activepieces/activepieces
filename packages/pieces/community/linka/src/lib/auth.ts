import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownDescription = `
  Follow these instructions to get your Linka API Key:

  1. Visit the following website: https://crm.linka.ai/ or the beta website: https://beta.linka.ai/
  2. Once on the website, locate and click on the admin to obtain your Linka API Key.
`;

export const linkaAuth = PieceAuth.CustomAuth({
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
            label: 'Linka Live (crm.linka.ai)',
            value: 'https://crm.linka.ai/',
          },
          {
            label: 'Linka Beta (beta.linka.ai)',
            value: 'https://beta.linka.ai/',
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
