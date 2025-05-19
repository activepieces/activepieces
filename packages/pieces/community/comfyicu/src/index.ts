import { createPiece, PieceAuth } from '@activepieces/pieces-framework';

import { comfyicuAuth } from './lib/common/index';
import { submitWorkflowRun } from './lib/actions/submit-workflow-run';
import { getRunStatus } from './lib/actions/get-run-status';
import { cancelRun } from './lib/actions/cancel-run';
import { createWorkflow } from './lib/actions/create-workflow';
import { getRunOutputs } from './lib/actions/get-run-outputs';
import { listModels } from './lib/actions/list-models';
import { listWorkflows } from './lib/actions/list-workflows';
import { setWebhook } from './lib/actions/set-webhook';
import { runCompleted } from './lib/triggers/run-completed';
import { modelUpdated } from './lib/triggers/model-updated';
import { newWorkflowCreated } from './lib/triggers/new-workflow-created';
import { runFailed } from './lib/triggers/run-failed';

export const comfyicu = createPiece({
  displayName: 'Comfyicu',
  auth: comfyicuAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/comfyicu.png',
  authors: [],
  actions: [
    submitWorkflowRun,
    getRunStatus,
    listWorkflows,
    getRunOutputs,
    listModels,
    createWorkflow,
    setWebhook,
    cancelRun,
  ],
  triggers: [runCompleted, runFailed, newWorkflowCreated, modelUpdated],
});
