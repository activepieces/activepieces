import { AuthProp, Piece } from '@activepieces/pieces-framework';

export const bloomerang = Piece.create({
  displayName: 'Bloomerang',
  logoUrl: 'https://cdn.activepieces.com/pieces/bloomerang.png',
  authors: ['HKudria'],
  auth: AuthProp.SecretText({
    displayName: "API Key",
    required: true,
    description: "API key acquired from your Bloomerang crm"
  }),
});
