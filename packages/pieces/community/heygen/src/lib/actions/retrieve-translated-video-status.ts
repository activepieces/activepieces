import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const retrieveTranslatedVideoStatus = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'retrieveTranslatedVideoStatus',
  displayName: 'Retrieve Translated Video Status',
  description: 'Track the progress and status of your video translations in real-time. Note: Video URLs expire in 7 days.',
  props: {
    video_translate_id: Property.ShortText({
      displayName: 'Video Translate ID',
      description: 'The ID of the translated video to check status for',
      required: true,
    }),
  },
  async run(context) {
    const { video_translate_id } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.heygen.com/v2/video_translate/${video_translate_id}`,
        headers: {
          'x-api-key': context.auth as string,
          'Content-Type': 'application/json',
        },
      });

      const videoData = response.body.data;

      return {
        success: true,
        video_translate_id: videoData.video_translate_id,
        title: videoData.title,
        status: videoData.status,
        url: videoData.url,
        message: videoData.message,
        // Add a note about URL expiration
        note: videoData.url ? 'Video URL will expire in 7 days. Call this endpoint again to get a new URL.' : null,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Translated video with ID ${video_translate_id} not found.`);
      }
      if (error.response?.status === 403) {
        throw new Error('Authentication failed. Please check your API key.');
      }
      throw new Error(`Failed to retrieve translated video status: ${error.message}`);
    }
  },
});
