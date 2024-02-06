import { createCustomApiCallAction } from '@activepieces/pieces-common';
import {
  createPiece,
  PieceAuth,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';

const markdownDescription = `
To access your **Secret API Key**
---
1. Log in to ActiveCampaign
2. Go to Settings, then Developer. https://{{your_account_name_here}}.activehosted.com/app/settings/developer
3. Under \`API Access\` copy \`Key\` and Paste it below.
4. Click **Save**
`;

export const activeCampaignAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    account_name: Property.ShortText({
      displayName: 'Account Name',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  required: true,
});

export const activecampaign = createPiece({
  displayName: 'ActiveCampaign',
  auth: activeCampaignAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl:
    'https://www.activecampaign.com/themes/v2/images/favicons/favicon.svg',
  authors: ['kanarelo'],
  actions: [
    createCustomApiCallAction({
      auth: activeCampaignAuth,
      baseUrl: (auth) => {
        const { account_name } = auth as PiecePropValueSchema<
          typeof activeCampaignAuth
        >;
        return `https://${account_name}.api-us1.com/api/3`;
      },
      authMapping: (auth) => {
        const { api_key } = auth as PiecePropValueSchema<typeof activeCampaignAuth>;
        return {
          'Api-Token':  api_key
        };
      },
    }),
  ],
  triggers: [],
});
