import { callsyncWebhookTrigger } from '../common/webhook-trigger';
import { recordingUploadedSample } from '../common/samples';

export const newRecording = callsyncWebhookTrigger({
  name: 'new_recording',
  displayName: 'New Call Recording',
  description: 'Triggers when a call recording finishes uploading.',
  aiDescription:
    'Fires when the audio recording of a CallSync call finishes uploading, with a link to the recording and the call details.',
  event: 'recording_updated',
  sampleData: recordingUploadedSample,
});
