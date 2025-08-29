import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { createCall, getMeetingRecording, getMeetingTranscription } from './lib/actions';
import { newNote, newMeetingScheduled, meetingRescheduled, meetingCancelled } from './lib/triggers';

export const avomaApi = createPiece({
  displayName: 'Avoma API',
  description:
    'Avoma is an AI Meeting Assistant that automatically records, transcribes, and summarizes your meetings.',
  auth: PieceAuth.SecretText({
    displayName: 'API Key',
    description:
      'Your Avoma API Key (Bearer token). Generate it from your Avoma API Integration settings: https://help.avoma.com/api-integration-for-avoma',
    required: true
  }),
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/avoma-api.png',
  authors: [],
  actions: [createCall, getMeetingRecording, getMeetingTranscription],
  triggers: [newNote, newMeetingScheduled, meetingRescheduled, meetingCancelled]
});
