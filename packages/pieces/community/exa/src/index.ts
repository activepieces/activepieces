import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { getContentsAction } from './lib/actions/get-contents';
import { generateAnswerAction } from './lib/actions/generate-answer';
import { performSearchAction } from './lib/actions/perform-search';
import { findSimilarLinksAction } from './lib/actions/find-similar-links';
import { createAgentRunAction } from './lib/actions/agent/create-agent-run';
import { getAgentRunAction } from './lib/actions/agent/get-agent-run';
import { listAgentRunsAction } from './lib/actions/agent/list-agent-runs';
import { cancelAgentRunAction } from './lib/actions/agent/cancel-agent-run';
import { exaSearchAction } from './lib/actions/ai/exa-search';
import { exaGetContentsAction } from './lib/actions/ai/exa-get-contents';
import { exaAnswerAction } from './lib/actions/ai/exa-answer';
import { newSearchMonitorResultsTrigger } from './lib/triggers/new-search-monitor-results';
import { exaCustomApiCallAction } from './lib/actions/custom-api-call';
import { exaAuth } from './lib/auth';

export const exa = createPiece({
  displayName: 'Exa',
  description: 'AI-powered search and content extraction from the web.',
  auth: exaAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/exa.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE,PieceCategory.PRODUCTIVITY],
  authors: ['krushnarout','kishanprmr'],
  actions: [
    getContentsAction,
    generateAnswerAction,
    performSearchAction,
    findSimilarLinksAction,
    createAgentRunAction,
    getAgentRunAction,
    listAgentRunsAction,
    cancelAgentRunAction,
    exaSearchAction,
    exaGetContentsAction,
    exaAnswerAction,
    exaCustomApiCallAction,
  ],
  triggers: [newSearchMonitorResultsTrigger],
});
