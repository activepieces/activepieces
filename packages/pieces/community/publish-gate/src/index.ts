import {
  createPiece,
  PieceAuth,
  PieceCategory,
} from '@activepieces/pieces-framework';
import { continueIfPublished } from './lib/actions/continue-if-published';

export const publishGate = createPiece({
  displayName: 'Publish Gate',
  description:
    'Stops an automation before its next steps unless it has been published, so test runs never trigger your real actions.',
  minimumSupportedRelease: '0.86.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/publish-gate.png',
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  authors: ['Devansh-hello'],
  auth: PieceAuth.None(),
  actions: [continueIfPublished],
  triggers: [],
});
