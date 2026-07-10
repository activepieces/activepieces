import { fathomAuth, getFathomClient } from '../common/auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { GetRecordingTranscriptRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

export const getRecordingTranscript = createAction({
  name: 'getRecordingTranscript',
  displayName: 'Get Recording Transcript',
  description: 'Get the AI-generated transcript of a meeting recording. Note: This action requires API Key authentication and is not available when using OAuth2.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the full transcript of a single Fathom meeting recording, identified by its recording ID. Use when you need the verbatim spoken content rather than the summary. Read-only and repeatable; optionally supply a destination URL to have Fathom POST the transcript there instead of returning it inline. Requires API Key auth (not available under OAuth2).', idempotent: true },
  auth: fathomAuth,
  props: {
    recording_id: Property.Dropdown({
      auth: fathomAuth,
      displayName: 'Meeting Recording',
      description: 'Select the meeting recording to get the transcript for',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first'
          };
        }

        try {
          const fathom = getFathomClient(auth);

          const meetingsIterator = await fathom.listMeetings();

          const options: { label: string; value: number }[] = [];
          for await (const response of meetingsIterator) {
            if (response && response.result && response.result.items) {
              response.result.items.forEach((meeting) => {
                const label = meeting.title || `Meeting on ${meeting.scheduledStartTime.toLocaleDateString()}`;
                options.push({
                  label: label,
                  value: meeting.recordingId
                });
              });
            }
          }

          return {
            disabled: false,
            options: options
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load meetings. Please check your connection.'
          };
        }
      }
    }),
    destination_url: Property.ShortText({
      displayName: 'Destination URL',
      description: 'Optional: URL where Fathom will POST the transcript. Leave empty to get data directly in response.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fathom = getFathomClient(auth);

    const request = {
      recordingId: propsValue.recording_id,
      ...(propsValue.destination_url && { destinationUrl: propsValue.destination_url })
    } as GetRecordingTranscriptRequest;

    const response = await fathom.getRecordingTranscript(request);

    return response;
  },
});
