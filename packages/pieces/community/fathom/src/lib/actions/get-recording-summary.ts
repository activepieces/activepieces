import { fathomAuth, getFathomClient } from '../common/auth';
import { createAction, Property } from '@activepieces/pieces-framework';

export const getRecordingSummary = createAction({
  name: 'getRecordingSummary',
  displayName: 'Get Recording Summary',
  description: 'Get the AI-generated summary of a meeting recording. Note: This action requires API Key authentication and is not available when using OAuth2.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the AI-generated summary of a single Fathom meeting recording, identified by its recording ID. Use to pull a concise recap of what a recorded meeting covered. Read-only and repeatable; optionally supply a destination URL to have Fathom POST the summary there instead of returning it inline. Requires API Key auth (not available under OAuth2).', idempotent: true },
  auth: fathomAuth,
  props: {
    recording_id: Property.Dropdown({
      auth: fathomAuth,
      displayName: 'Meeting Recording',
      description: 'Select the meeting recording to get the summary for',
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
      description: 'Optional: URL where Fathom will POST the summary. Leave empty to get data directly in response.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const fathom = getFathomClient(auth);

    const request = {
      recordingId: propsValue.recording_id,
      ...(propsValue.destination_url && { destinationUrl: propsValue.destination_url })
    };

    const response = await fathom.getRecordingSummary(request);

    return response;
  },
});
