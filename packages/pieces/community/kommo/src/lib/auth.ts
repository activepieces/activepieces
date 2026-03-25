import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
Please follow [Generate Long Live Token](https://developers.kommo.com/docs/long-lived-token) guide for generating token.

Your Kommo account subdomain (e.g., "mycompany" if your URL is mycompany.kommo.com).

`;

export const kommoAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  required: true,
  props: {
    subdomain: PieceAuth.SecretText({
      displayName: 'Subdomain',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'Token',
      required: true,
    }),
  },
});
