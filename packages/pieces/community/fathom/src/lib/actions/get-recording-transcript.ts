import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRecordingTranscript = createAction({
  auth: fathomAuth,
  name: 'get-recording-transcript',
  displayName: 'Get Recording Transcript',
  description: 'Retrieves the transcript for a specific recording from Fathom',
  props: {
    recordingId: Property.Number({
      displayName: 'Recording ID',
      description: 'The ID of the meeting recording to fetch the transcript for',
      required: true,
    }),
    destinationUrl: Property.ShortText({
      displayName: 'Destination URL (Optional)',
      description: 'If provided, Fathom will POST the transcript to this URL asynchronously instead of returning it directly',
      required: false,
    }),
  },
  async run(context) {
    const { recordingId, destinationUrl } = context.propsValue;

    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    // Build query parameters if destination URL is provided
    const path = destinationUrl
      ? `/recordings/${recordingId}/transcript?destination_url=${encodeURIComponent(destinationUrl)}`
      : `/recordings/${recordingId}/transcript`;

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
