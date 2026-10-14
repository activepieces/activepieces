import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { findListAction } from './lib/actions/find-list';
import { getListResultsAction } from './lib/actions/get-list-results';
import { specstreamCustomApiCallAction } from './lib/actions/custom-api-call';
import { newRowTrigger, newWatchedRowTrigger } from './lib/triggers/row-triggers';
import { specstreamAuth } from './lib/auth';

export const specstream = createPiece({
  displayName: 'SpecStream',
  description: 'The live web data engine for teams and agents: ask for any list in plain words and get every match with its source.',
  auth: specstreamAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/specstream.png',
  categories: [PieceCategory.SALES_AND_CRM, PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['specstream'],
  actions: [findListAction, getListResultsAction, specstreamCustomApiCallAction],
  triggers: [newRowTrigger, newWatchedRowTrigger],
});
