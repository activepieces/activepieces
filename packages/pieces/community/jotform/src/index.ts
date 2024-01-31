import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { newSubmission } from './lib/triggers/new-submission';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { jotformCommon } from './lib/common';

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
            label: 'US (jotform.com)',
            value: 'us',
          },
          {
            label: 'EU (eu.jotform.com)',
            value: 'eu',
          },
        ],
      },
    }),
  },
});

export const jotform = createPiece({
  displayName: 'Jotform',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/jotform.svg',
  authors: ['MoShizzle'],
  auth: jotformAuth,
  actions: [
    createCustomApiCallAction({
      baseUrl: (auth) => jotformCommon.baseUrl((auth as { region: string }).region),
      auth: jotformAuth,
      authMapping: (auth) => ({
        APIKEY: (auth as { apiKey: string }).apiKey,
      }),
    }),
  ],
  triggers: [newSubmission],
});
