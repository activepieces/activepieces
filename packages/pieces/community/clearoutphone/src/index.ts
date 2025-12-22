import { createPiece } from '@activepieces/pieces-framework';
import { clearoutphoneAuth } from './lib/common/auth';
import { findPhoneNumberCarrier } from './lib/actions/find-phone-number-carrier';
import { findPhoneNumberIsMobile } from './lib/actions/find-phone-number-is-mobile';
import { validatePhoneNumber } from './lib/actions/validate-phone-number';
import { PieceCategory } from '@activepieces/shared';

export const clearoutphone = createPiece({
  displayName: 'ClearoutPhone',
  auth: clearoutphoneAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/clearoutphone.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.COMMUNICATION],
  description:
    'ClearoutPhone is a phone number validation and verification service that helps businesses ensure the accuracy and validity of their phone number data.',
  actions: [
    findPhoneNumberCarrier,
    findPhoneNumberIsMobile,
    validatePhoneNumber,
  ],
  triggers: [],
});
