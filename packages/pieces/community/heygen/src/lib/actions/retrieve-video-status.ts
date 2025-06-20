import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const retrieveVideoStatus = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'retrieveVideoStatus',
  displayName: 'Retrieve Video Status',
  description: 'Get the status and details of a specific video. Note: Video URLs expire in 7 days.',
  props: {
    video_id: Property.ShortText({
      displayName: 'Video ID',
      description: 'The ID of the video to retrieve status for',
      required: true,
    }),
  },
  async run(context) {
    const { video_id } = context.propsValue;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.heygen.com/v1/video_status.get',
        headers: {
          'x-api-key': context.auth as string,
          'Content-Type': 'application/json',
        },
        queryParams: {
          video_id,
        },
      });

      const videoData = response.body.data;

      return {
        success: true,
        video_id: videoData.id,
        status: videoData.status,
        created_at: videoData.created_at,
        duration: videoData.duration,
        error: videoData.error,
        callback_id: videoData.callback_id,
        caption_url: videoData.caption_url,
        gif_url: videoData.gif_url,
        thumbnail_url: videoData.thumbnail_url,
        video_url: videoData.video_url,
        video_url_caption: videoData.video_url_caption,
        // Add a note about URL expiration
        note: videoData.video_url ? 'Video URL will expire in 7 days. Call this endpoint again to get a new URL.' : null,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error(`Video with ID ${video_id} not found or you don't have access to it.`);
      }
      if (error.response?.status === 400) {
        throw new Error('Request limit exceeded or invalid request format.');
      }
      if (error.response?.status === 424) {
        throw new Error('Invalid parameters provided.');
      }
      throw new Error(`Failed to retrieve video status: ${error.message}`);
    }
  },
});
