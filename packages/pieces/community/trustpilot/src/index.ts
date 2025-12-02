import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { trustpilotAuth } from './lib/common/auth';
import { createInvitation } from './lib/actions/create-invitation';
import { PieceCategory } from '@activepieces/shared';

export const trustpilot = createPiece({
  displayName: 'Trustpilot',
  auth: trustpilotAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/trustpilot.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  description:
    'Trustpilot is a customer review management platform that helps businesses collect and manage reviews to build trust and credibility with their customers.',
  actions: [createInvitation],
  triggers: [],
});
