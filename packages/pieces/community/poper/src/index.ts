import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { newLead } from './lib/triggers/new-lead';
import { PieceCategory } from '@activepieces/pieces-framework';

export const poper = createPiece({
  displayName: 'Poper',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.MARKETING],
  description:
    'AI popup builder that turns website visitors into leads and customers.',
  logoUrl: 'https://cdn.activepieces.com/pieces/poper.png',
  authors: ['thirstycode'],
  actions: [],
  triggers: [newLead],
});
