import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { verifyEmailAddress } from './lib/actions/verify-email-address';
import { neverbounceAuth } from './lib/common/auth';
import { PieceCategory } from '@activepieces/shared';

export const neverbounce = createPiece({
  displayName: 'Neverbounce',
  auth: neverbounceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/neverbounce.png',
  categories: [PieceCategory.SALES_AND_CRM],
  description:
    'NeverBounce is an email verification service that improves deliverability and helps businesses adhere to strict deliverability guidelines.',
  authors: ['sanket-a11y'],
  actions: [verifyEmailAddress],
  triggers: [],
});
