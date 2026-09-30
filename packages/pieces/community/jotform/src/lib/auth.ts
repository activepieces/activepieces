import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownDescription = `
To obtain api key, follow the steps below:
1. Go to Settings -> API
2. Click on "Create New Key" button
3. Change the permissions to "Full Access"
4. Copy the API Key and paste it in the API Key field
`;

export const jotformAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownDescription,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    region: Property.StaticDropdown({
      displayName: 'Region',
      required: true,
      options: {
        options: [
          {
            label: 'US (api.jotform.com)',
            value: 'us',
          },
          {
            label: 'EU (eu-api.jotform.com)',
            value: 'eu',
          },
          {
            label: 'HIPAA (hipaa-api.jotform.com)',
            value: 'hipaa',
          },
        ],
      },
    }),
  },
});
