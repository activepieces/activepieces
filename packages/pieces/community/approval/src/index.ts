import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createApprovalLink } from './lib/actions/create-approval-link';
import { waitForApprovalLink } from './lib/actions/wait-for-approval';

export const approval = createPiece({
  displayName: 'Approval',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/approval.svg',
  authors: ['khaledmashaly'],
  categories: [PieceCategory.CORE],
  actions: [waitForApprovalLink, createApprovalLink],
  triggers: [],
});
