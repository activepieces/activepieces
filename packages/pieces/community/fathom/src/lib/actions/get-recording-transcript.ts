import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { fathomClient } from '../common/client';
import { fathomProps } from '../common/props';
import { fathomSdk } from '../common/sdk';
import { fathomOutputSchemas } from '../output-schemas';

export const getRecordingTranscript = createAction({
  name: 'getRecordingTranscript',
  classification: 'READ',
  displayName: 'Get Recording Transcript',
  description: 'Get the transcript of a meeting recording. Works with both OAuth and API key connections.',
  audience: 'human',
  aiMetadata: {
    description:
      'Retrieves the speaker-attributed transcript of one Fathom recording picked from a list of recent meetings, or asks Fathom to POST it to a destination URL instead. Agents should use Get Recording Transcript (AI), which takes a recording ID. Read-only and idempotent.',
    idempotent: true,
  },
  auth: fathomAuth,
  props: {
    recording_id: fathomProps.recordingDropdown({ description: 'Select the meeting recording to get the transcript for' }),
    destination_url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'Optional: URL where Fathom will POST the transcript. Leave empty to get data directly in response.',
      required: false,
    }),
  },
  outputSchema: fathomOutputSchemas.legacyTranscript,
  async run({ auth, propsValue }) {
    const { sdk, requireResult } = fathomSdk.create({ auth });
    const destinationUrl = propsValue.destination_url?.trim();
    if (destinationUrl) {
      const response = await sdk.getRecordingTranscript({ recordingId: propsValue.recording_id, destinationUrl });
      return requireResult({ value: response, operation: 'Get Recording Transcript' });
    }
    const body = await fathomClient.requestObject({
      auth,
      method: HttpMethod.GET,
      path: `recordings/${propsValue.recording_id}/transcript`,
    });
    const lines = Array.isArray(body['transcript']) ? body['transcript'].filter(fathomClient.isRecord) : [];
    return { transcript: lines.map(toCamelLine) };
  },
});

function toCamelLine(line: Record<string, unknown>) {
  const speaker = fathomClient.isRecord(line['speaker']) ? line['speaker'] : {};
  const email = speaker['matched_calendar_invitee_email'];
  return {
    speaker: {
      displayName: speaker['display_name'],
      ...(email === undefined ? {} : { matchedCalendarInviteeEmail: email }),
    },
    text: line['text'],
    timestamp: line['timestamp'],
  };
}
