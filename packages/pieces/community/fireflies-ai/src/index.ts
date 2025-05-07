import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { findMeetingById } from './lib/actions/find-meeting-by-id';
import { findRecentMeetings } from './lib/actions/find-recent-meetings';
import { findMeetingsByQuery } from './lib/actions/find-meetings-by-query';
import { uploadAudioAction } from './lib/actions/upload-audio';
import { getUserDetailsAction } from './lib/actions/get-user-details';
import { newTranscriptionComplete } from './lib/triggers/new-transcription-complete';

export const firefliesAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Fireflies.ai API Key (obtain from your Fireflies dashboard)',
  required: true,
});

export const firefliesAi = createPiece({
  displayName: 'Fireflies AI',
  logoUrl: 'https://cdn.activepieces.com/pieces/fireflies-ai.png',
  auth: firefliesAiAuth,
  minimumSupportedRelease: '0.36.1',
  authors: [
    'onyedikachi-david'
  ],
  actions: [
    findMeetingById,
    findRecentMeetings,
    findMeetingsByQuery,
    uploadAudioAction,
    getUserDetailsAction,
  ],
  triggers: [
    newTranscriptionComplete,
  ],
});
