import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  createCustomApiCallAction,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { BASE_URL, makeRequest } from './lib/common';
import { runWorkflow } from './lib/actions/run-workflow';
import { runWorkflowAsync } from './lib/actions/run-workflow-async';
import { getExecution } from './lib/actions/get-execution';

export const airOpsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your API key can be found in the **Workspace Settings** section of your AirOps account.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await makeRequest(auth, HttpMethod.GET, '/public_api/airops_apps');
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});

export const airOps = createPiece({
  displayName: 'AirOps',
  description: 'Build and deploy AI-powered workflows and agents.',
  auth: airOpsAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/air-ops.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['onyedikachi-david'],
  actions: [
    runWorkflow,
    runWorkflowAsync,
    getExecution,
    createCustomApiCallAction({
      auth: airOpsAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
