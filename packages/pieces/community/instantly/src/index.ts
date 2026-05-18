import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { instantlyAuth } from './lib/auth';
import { instantlyAddLeadAction } from './lib/actions/add-lead';

export const instantly = createPiece({
  displayName: 'Instantly.ai',
  description: 'Cold email outreach and lead management platform',
  auth: instantlyAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/instantly.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES],
  authors: ['oocheol'],
  actions: [instantlyAddLeadAction],
  triggers: [],
});
