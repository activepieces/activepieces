import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { puppetflowAuth } from './lib/auth';
import { normalizeInstanceUrl } from './lib/common/client';
import { searchFlowsAction } from './lib/actions/search-flows';
import { triggerFlowAction } from './lib/actions/trigger-flow';
import { triggerFlowAndWaitAction } from './lib/actions/trigger-flow-and-wait';
import { getRunAction } from './lib/actions/get-run';
import { getRunResultAction } from './lib/actions/get-run-result';
import { listRunsAction } from './lib/actions/list-runs';
import { searchRunsAction } from './lib/actions/search-runs';
import { continueRunAction } from './lib/actions/continue-run';
import { listArtifactsAction } from './lib/actions/list-artifacts';
import { downloadArtifactAction } from './lib/actions/download-artifact';
import { downloadRecordingAction } from './lib/actions/download-recording';

export const puppetflow = createPiece({
  displayName: 'Puppetflow',
  description:
    'Self-hosted browser automation: trigger Puppeteer flows, follow runs, and retrieve results, screenshots, downloads, and recordings.',
  auth: puppetflowAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://www.puppetflow.com/img/logo.png',
  categories: [PieceCategory.PRODUCTIVITY, PieceCategory.DEVELOPER_TOOLS],
  authors: ['jr-k'],
  actions: [
    triggerFlowAction,
    triggerFlowAndWaitAction,
    searchFlowsAction,
    getRunAction,
    getRunResultAction,
    listRunsAction,
    searchRunsAction,
    continueRunAction,
    listArtifactsAction,
    downloadArtifactAction,
    downloadRecordingAction,
    createCustomApiCallAction({
      auth: puppetflowAuth,
      baseUrl: (auth) =>
        auth ? `${normalizeInstanceUrl(auth.props.instanceUrl)}/api/v1` : '',
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.props.apiKey}`,
      }),
    }),
  ],
  triggers: [],
});
