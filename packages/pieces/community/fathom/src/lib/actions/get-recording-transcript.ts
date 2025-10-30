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
    recordingId: Property.ShortText({
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

    // Build path according to Fathom API docs: GET /recordings/{recording_id}/transcript
    const path = destinationUrl
      ? `/recordings/${recordingId}/transcript?destination_url=${encodeURIComponent(destinationUrl)}`
      : `/recordings/${recordingId}/transcript`;

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      path
    );

    // If destinationUrl was provided, return the destination info
    if (destinationUrl) {
      return response;
    }

    // Check if transcript exists and is not null
    if (!response || !response.transcript) {
      return {
        error: 'No transcript available',
        message: 'The recording may not have been processed yet or no transcript was generated. Wait a few minutes after the recording completes and try again.',
        raw_response: response,
      };
    }

    // Return the transcript in a structured format
    return {
      transcript: response.transcript,
      word_count: Array.isArray(response.transcript) ? response.transcript.reduce((sum: number, entry: any) => sum + (entry.text || '').split(' ').length, 0) : 0,
      speakers: Array.isArray(response.transcript) ? [...new Set(response.transcript.map((entry: any) => entry.speaker).filter(Boolean))] : [],
      // Include full response for debugging
      _raw: response,
    };
  },
});
