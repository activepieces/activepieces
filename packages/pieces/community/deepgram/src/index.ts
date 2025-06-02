import { createPiece } from '@activepieces/pieces-framework';
import { deepgramAuth } from './common/auth';
import { createSummaryAction } from './actions/create-summary';
import { transcribeAudioAction } from './actions/transcribe-audio';
import { createTranscriptionCallbackAction } from './actions/create-transcription';
import { listProjectsAction } from './actions/list-projects';
import { textToSpeechAction } from './actions/text-to-speech';

export const deepgramPiece = createPiece({
  displayName: 'Deepgram',
  logoUrl: 'https://cdn.activepieces.com/pieces/deepgram.png',
  description: 'Deepgram is an AI-powered speech recognition platform that provides real-time transcription, text-to-speech, and audio analysis capabilities.',
  minimumSupportedRelease: '0.30.0',
  authors: [],
  auth: deepgramAuth,
  actions: [
    createSummaryAction,
    transcribeAudioAction,
    createTranscriptionCallbackAction,
    listProjectsAction,
    textToSpeechAction,
  ],
  triggers: [],
});