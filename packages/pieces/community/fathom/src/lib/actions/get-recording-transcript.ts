import { fathomAuth } from '../..';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Fathom } from 'fathom-typescript';
import { GetRecordingTranscriptRequest } from 'fathom-typescript/dist/esm/sdk/models/operations';

export const getRecordingTranscript = createAction({
  name: 'getRecordingTranscript',
  displayName: 'Get Recording Transcript',
  description: 'Get the AI-generated transcript of a meeting recording',
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
          const fathom = new Fathom({
            security: { apiKeyAuth: auth.secret_text },
          });

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
            placeholder: 'Failed to load meetings. Please check your API key.'
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
    const fathom = new Fathom({
      security: { apiKeyAuth: auth.secret_text },
    });

    const request = {
      recordingId: propsValue.recording_id,
      ...(propsValue.destination_url && { destinationUrl: propsValue.destination_url })
    } as GetRecordingTranscriptRequest;

    const response = await fathom.getRecordingTranscript(request);

    return response;
  },
});
