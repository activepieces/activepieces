import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { callFlow } from './lib/actions/call-flow';
import { processCsvInChunks } from './lib/actions/process-csv-in-chunks';
import { callableFlow } from './lib/triggers/callable-flow';
import { response } from './lib/actions/respond';
import { PieceCategory } from '@activepieces/pieces-framework';

export const flows = createPiece({
  displayName: 'Sub Flows',
  description: 'Trigger and call another sub flow.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.82.0',
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/subflows.svg',
  authors: ['hazemadelkhalel'],
  actions: [callFlow, processCsvInChunks, response],
  triggers: [callableFlow],
});
