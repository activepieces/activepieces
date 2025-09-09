import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const copperAuth = PieceAuth.CustomAuth({
  description:
    'Find your API Key in Copper under Settings > Integrations > API Keys. The email should be the user email associated with the API key.',
  props: {
    api_key: Property.SecretText({
      displayName: 'API Key',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'User Email',
      required: true,
    }),
  },
});

export type CopperAuth = {
  api_key: string;
  email: string;
};

