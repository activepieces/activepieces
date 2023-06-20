import { AuthProp, Piece } from '@activepieces/pieces-framework';

export const bannerbear = Piece.create({
  displayName: "Bannerbear",
  logoUrl: 'https://cdn.activepieces.com/pieces/bannerbear.png',
  authors: ["kanarelo"],
  auth: AuthProp.SecretText({
    displayName: 'API Key',
    description: 'Bannerbear API Key',
    required: true,
  }),
});

