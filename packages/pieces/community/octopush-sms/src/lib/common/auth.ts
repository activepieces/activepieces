import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdown = `

`;

export const octopushAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    api_login: Property.ShortText({
      displayName: 'API Login',
      description: ' Your Octopush API Login',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: ' Your Octopush API Key',
      required: true,
    }),
  },
});
