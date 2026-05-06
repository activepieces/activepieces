import { PieceAuth } from '@activepieces/pieces-framework';

export const acumbamailAuth = PieceAuth.SecretText({
  displayName: 'Auth Token',
  required: true,
  description: `
  To obtain your Auth Token, follow these steps:
  1. Login to your Acumbamail account.
  2. Go to **https://acumbamail.com/apidoc/**.
  3. Under **Customer identifier**, you can find auth token;
  `,
});
