import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { fathomAuth } from '../../common/auth';
import { fathomClient } from '../../common/client';
import { fathomInputs, fathomProps } from '../../common/props';
import { fathomOutputSchemas } from '../../output-schemas';

export const aiGetRecordingTranscript = createAction({
  name: 'fathom_get_recording_transcript',
  classification: 'READ',
  displayName: 'Get Recording Transcript (AI)',
  description: 'Gets the transcript of one recording by its recording ID. Built for AI agents.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the full speaker-attributed transcript of one Fathom recording, each line with speaker name, matched invitee email and HH:MM:SS timestamp. Use when exact wording or who-said-what matters; prefer Get Recording Summary for a recap. Heavy-request limit applies. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    recording_id: fathomProps.recordingIdText({ description: 'The numeric recording_id from New Recording or List Meetings.' }),
  },
  outputSchema: fathomOutputSchemas.recordingTranscript,
  async run({ auth, propsValue }) {
    const recordingId = fathomInputs.parseRecordingId({ value: propsValue.recording_id });
    const body = await fathomClient.requestObject({ auth, method: HttpMethod.GET, path: `recordings/${recordingId}/transcript` });
    return { recording_id: recordingId, transcript: Array.isArray(body['transcript']) ? body['transcript'] : [] };
  },
});
