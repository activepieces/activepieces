import { AuthProp, Piece } from '@activepieces/pieces-framework';

export const certopus = Piece.create({
  displayName: 'Certopus',
  logoUrl: 'https://cdn.activepieces.com/pieces/certopus.png',
  authors: ['VrajGohil'],
  auth: AuthProp.SecretText({
    displayName: "API Key",
    required: true,
    description: "API key acquired from your Certopus profile"
  }),
});
