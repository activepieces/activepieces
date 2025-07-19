import { PieceAuth, createPiece } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { createApprovalLink } from './lib/actions/create-approval-link';
import { waitForApprovalLink } from './lib/actions/wait-for-approval';

export const approval = createPiece({
  displayName: 'Approval (Legacy)',
  description: 'Build approval process in your workflows',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/approval.svg',
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  actions: [waitForApprovalLink, createApprovalLink],
  triggers: [],
});
