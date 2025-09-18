import { PieceAuth } from '@activepieces/pieces-framework';

export const magicslidesAuth = PieceAuth.SecretText({
  displayName: 'Access ID',
  description:
    'Get your Access ID from your MagicSlides dashboard under API Settings.',
  required: true,
});
