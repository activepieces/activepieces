import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { submitWorkflowRun } from './lib/actions/submit-workflow-run';
import { getRunStatus } from './lib/actions/get-run-status';
import { listWorkflows } from "./lib/actions/list-workflows";
import { getRunOutputs } from "./lib/actions/get-run-outputs";
import { listModels } from "./lib/actions/list-models";
import { createWorkflow } from "./lib/actions/create-workflow";
import { setWebhook } from "./lib/actions/set-webhook";
import { cancelRun } from "./lib/actions/cancel-run";
import { runCompleted } from "./lib/triggers/run-completed";
import { runFailed } from "./lib/triggers/run-failed";
import { newWorkflowCreated } from "./lib/triggers/new-workflow-created";
import { modelUpdated } from "./lib/triggers/model-updated";

export const comfyicuAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your comfyicu API key please [click here to create your account](https://comfy.icu/account).`,
  required: true,
});

export const comfyicu = createPiece({
  displayName: "ComfyICU",
  auth: comfyicuAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/comfyicu.png",
  authors: ['activepieces-community'],
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
  triggers: [
    runCompleted,
    runFailed,
    newWorkflowCreated,
    modelUpdated,
  ],
});
    