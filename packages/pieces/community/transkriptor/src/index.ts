import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { transkriptorAuth } from './lib/auth';
import { transcribeUrlAction } from './lib/actions/transcribe-url';
import { transcribeMeetingAction } from './lib/actions/transcribe-meeting';
import { getTranscriptAction } from './lib/actions/get-transcript';
import { exportTranscriptAction } from './lib/actions/export-transcript';
import { listTranscriptsAction } from './lib/actions/list-transcripts';
import { deleteFileAction } from './lib/actions/delete-file';
import { transcriptionCompletedTrigger } from './lib/triggers/transcription-completed';

export const transkriptor = createPiece({
  displayName: 'Transkriptor',
  description:
    'AI-powered transcription service supporting 100+ languages with speaker recognition, timestamps, and automated summaries.',
  logoUrl: 'https://cdn.activepieces.com/pieces/transkriptor.png',
  authors: ['transkriptor'],
  auth: transkriptorAuth,
  actions: [
    transcribeUrlAction,
    transcribeMeetingAction,
    getTranscriptAction,
    exportTranscriptAction,
    listTranscriptsAction,
    deleteFileAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.tor.app/developer',
      auth: transkriptorAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [transcriptionCompletedTrigger],
  categories: [PieceCategory.PRODUCTIVITY],
});
