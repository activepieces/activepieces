import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { callFlow } from './lib/actions/call-flow';
import { callableFlow } from './lib/triggers/callable-flow';
import { response } from './lib/actions/respond';
import { PieceCategory } from '@activepieces/shared';

export const flows = createPiece({
  displayName: 'Sub Flows',
  description: 'Build modular automations by splitting logic into reusable subflows. A parent flow can call a child flow, pass data to it, and optionally wait for a response.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.67.1',
  categories: [PieceCategory.CORE, PieceCategory.FLOW_CONTROL],
  logoUrl: 'https://cdn.activepieces.com/pieces/new-core/subflows.svg',
  authors: ['hazemadelkhalel'],
  actions: [callFlow, response],
  triggers: [callableFlow],
});
