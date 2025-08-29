import { createPiece } from '@activepieces/pieces-framework';
import { createCall } from './lib/actions/create-call';
import { getMeetingRecording } from './lib/actions/get-meeting-recording';
import { getMeetingTranscription } from './lib/actions/get-meeting-transcription';
import { avomaAuth } from './lib/common';
import { meetingCancelled } from './lib/triggers/meeting-cancelled';
import { meetingRescheduled } from './lib/triggers/meeting-rescheduled';
import { newMeetingScheduled } from './lib/triggers/new-meeting-scheduled';
import { newNote } from './lib/triggers/new-note';

export const avoma = createPiece({
  displayName: 'Avoma',
  auth: avomaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/avoma.png',
  authors: ['LuizDMM'],
  actions: [createCall, getMeetingRecording, getMeetingTranscription],
  triggers: [
    newNote,
    newMeetingScheduled,
    meetingRescheduled,
    meetingCancelled,
  ],
});
