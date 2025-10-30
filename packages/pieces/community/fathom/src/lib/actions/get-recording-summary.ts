import { createAction, Property } from '@activepieces/pieces-framework';
import { fathomAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getRecordingSummary = createAction({
  auth: fathomAuth,
  name: 'get-recording-summary',
  displayName: 'Get Recording Summary',
  description: 'Retrieves the summary for a specific recording from Fathom',
  props: {
    recordingId: Property.ShortText({
      displayName: 'Recording ID',
      description: 'The ID of the meeting recording to fetch the call summary for',
      required: true,
    }),
    destinationUrl: Property.ShortText({
      displayName: 'Destination URL (Optional)',
      description: 'If provided, Fathom will POST the summary to this URL asynchronously instead of returning it directly',
      required: false,
    }),
  },
  async run(context) {
    const { recordingId, destinationUrl } = context.propsValue;

    if (!recordingId) {
      throw new Error('Recording ID is required');
    }

    // Build path according to Fathom API docs: GET /recordings/{recording_id}/summary
    const path = destinationUrl
      ? `/recordings/${recordingId}/summary?destination_url=${encodeURIComponent(destinationUrl)}`
      : `/recordings/${recordingId}/summary`;

    const response = await makeRequest(
      context.auth as string,
      HttpMethod.GET,
      path
    );

    // If destinationUrl was provided, return the destination info
    if (destinationUrl) {
      return response;
    }

    // Check if summary exists and is not null
    if (!response || !response.summary) {
      return {
        error: 'No summary available',
        message: 'The recording may not have been processed yet or no summary was generated. Wait a few minutes after the recording completes and try again.',
        raw_response: response,
      };
    }

    // Return the summary with both raw and formatted versions
    return {
      summary: response.summary,
      markdown: response.summary.markdown_formatted || '',
      template: response.summary.template_name || 'general',
      // Include full response for debugging
      _raw: response,
    };
  },
});
