import { createPiece } from '@activepieces/pieces-framework';
import { skyvernAuth } from './lib/common/auth';
import { cancelWorkflowRun } from './lib/actions/cancel-workflow-run';
import { runAgentTask } from './lib/actions/run-agent-task';
import { findWorkflow } from './lib/actions/find-workflow';
import { getAWorkflowRunById } from './lib/actions/get-a-workflow-run-by-id';
import { runWorkflow } from './lib/actions/run-workflow';


export const skyvern = createPiece({
  displayName: 'Skyvern',
  auth: skyvernAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/skyvern.png',
  authors: ['Sanket6652'],
  actions: [
    cancelWorkflowRun,
    runAgentTask,
    findWorkflow,
    getAWorkflowRunById,
    getAWorkflowRunById,
    runAgentTask,
    runWorkflow,
  ],
  triggers: [],
});
