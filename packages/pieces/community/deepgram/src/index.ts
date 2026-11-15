import { createPiece } from '@activepieces/pieces-framework';
import { deepgramAuth } from './common/auth';
import { createSummaryAction } from './actions/create-summary';
import { createTranscriptionCallbackAction } from './actions/create-transcription';
import { listProjectsAction } from './actions/list-projects';
import { textToSpeechAction } from './actions/text-to-speech';
import { transcribeAudioAction } from './actions/transcribe-audio';
import { analyzeTextAction } from './actions/analyze-text';
import { listModelsAction } from './actions/list-models';
import { getProjectAction } from './actions/get-project';
import { updateProjectAction } from './actions/update-project';
import { listProjectMembersAction } from './actions/list-project-members';
import { listProjectKeysAction } from './actions/list-project-keys';
import { listRequestsAction } from './actions/list-requests';
import { getRequestAction } from './actions/get-request';
import { getUsageAction } from './actions/get-usage';
import { getBalancesAction } from './actions/get-balances';
import { getBillingBreakdownAction } from './actions/get-billing-breakdown';
import { generateSpeechAction } from './actions/ai/generate-speech';
import { transcribeAudioAiAction } from './actions/ai/transcribe-audio';
import { listModelsAiAction } from './actions/ai/list-models';
import { getModelAction } from './actions/ai/get-model';
import { listRequestsAiAction } from './actions/ai/list-requests';
import { getRequestAiAction } from './actions/ai/get-request';
import { listProjectMembersAiAction } from './actions/ai/list-project-members';
import { getUsageBreakdownAiAction } from './actions/ai/get-usage-breakdown';
import { getUsageSummaryAction } from './actions/ai/get-usage-summary';
import { listUsageFieldsAction } from './actions/ai/list-usage-fields';
import { listBalancesAiAction } from './actions/ai/list-balances';
import { getBalanceAction } from './actions/ai/get-balance';
import { getBillingBreakdownAiAction } from './actions/ai/get-billing-breakdown';
import { listBillingFieldsAction } from './actions/ai/list-billing-fields';
import { listPurchasesAction } from './actions/ai/list-purchases';
import { listThinkModelsAction } from './actions/ai/list-think-models';
import { PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './common/constants';
import { deepgramClient } from './common/client';

export const deepgramPiece = createPiece({
  displayName: 'Deepgram',
  logoUrl: 'https://cdn.activepieces.com/pieces/deepgram.png',
  description:
    'Deepgram is an AI-powered speech recognition platform that provides real-time transcription, text-to-speech, and audio analysis capabilities.',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  minimumSupportedRelease: '0.88.2',
  authors: ['Ani-4x', 'kishanprmr'],
  auth: deepgramAuth,
  actions: [
    transcribeAudioAction,
    analyzeTextAction,
    createSummaryAction,
    createTranscriptionCallbackAction,
    textToSpeechAction,
    generateSpeechAction,
    listModelsAction,
    listProjectsAction,
    getProjectAction,
    updateProjectAction,
    listProjectMembersAction,
    listProjectKeysAction,
    listRequestsAction,
    getRequestAction,
    getUsageAction,
    getBalancesAction,
    getBillingBreakdownAction,
    transcribeAudioAiAction,
    listModelsAiAction,
    getModelAction,
    listRequestsAiAction,
    getRequestAiAction,
    listProjectMembersAiAction,
    getUsageBreakdownAiAction,
    getUsageSummaryAction,
    listUsageFieldsAction,
    listBalancesAiAction,
    getBalanceAction,
    getBillingBreakdownAiAction,
    listBillingFieldsAction,
    listPurchasesAction,
    listThinkModelsAction,
    createCustomApiCallAction({
      auth: deepgramAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => deepgramClient.authHeader(auth.secret_text),
    }),
  ],
  triggers: [],
});
