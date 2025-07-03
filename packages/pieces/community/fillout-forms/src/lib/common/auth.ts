import { PieceAuth } from '@activepieces/pieces-framework';

export const filloutFormsAuth = PieceAuth.CustomAuth({
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
      
        '',
      required: true,
    }),
  },
  required: true,
});
