import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { waitForApprovalLink } from './lib/actions/wait-for-approval';
import { createApprovalLink } from './lib/actions/create-approval-link';

export const approval = createPiece({
  displayName: 'Approval',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.5.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/approval.svg',
  authors: ['khaledmashaly'],
  actions: [waitForApprovalLink, createApprovalLink],
  triggers: [],
});
