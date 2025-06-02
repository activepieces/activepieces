import { PieceAuth } from '@activepieces/pieces-framework';

export const crispAuth = PieceAuth.CustomAuth({
  description: 'Authenticate with your Crisp Identifier & Token',
  required: true,
  props: {
    identifier: PieceAuth.SecretText({
      displayName: 'Identifier',
      description: 'Your Crisp identifier (found alongside your Key)',
      required: true
    }),
    token: PieceAuth.SecretText({
      displayName: 'Crisp Token',
      description: 'Your Crisp Token Key (found in your Crisp dashboard under Settings > API)',
      required: true
    }),
    }
});