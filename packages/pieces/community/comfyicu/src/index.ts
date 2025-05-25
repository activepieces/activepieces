import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getRunOutputAction } from './lib/actions/get-run-outputs';
import { getRunStatusAction } from './lib/actions/get-run-status';
import { listWorkflowsAction } from './lib/actions/list-workflows';
import { submitWorkflowRunAction } from './lib/actions/submit-workflow-run';
import { newWorkflowCreatedTrigger } from './lib/triggers/new-workflow-created';
import { runCompletedTrigger } from './lib/triggers/run-completed';
import { runFailedTrigger } from './lib/triggers/run-failed';

export const comfyIcuAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain API key from [Account Settings](https://comfy.icu/account).`,
});

export const comfyicu = createPiece({
  displayName: 'Comfy.ICU',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: comfyIcuAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/comfyicu.png',
  authors: ['rimjhimyadav'],
  actions: [getRunOutputAction,getRunStatusAction,listWorkflowsAction,submitWorkflowRunAction],
  triggers: [newWorkflowCreatedTrigger,runCompletedTrigger,runFailedTrigger],
});
