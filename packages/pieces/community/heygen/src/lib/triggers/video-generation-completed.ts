import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { heygenAuth } from '../../index';

interface HeyGenError extends Error {
  status?: number;
}

export const videoGenerationCompleted = createTrigger({
  auth: heygenAuth,
  name: 'video_generation_completed',
  displayName: 'Video Generation Completed',
  description: 'Triggers when a video generation process completes successfully',
  props: {
    video_id: Property.ShortText({
      displayName: 'Video ID',
      description: 'The ID of the video to monitor',
      required: true,
    }),
  },
  type: TriggerStrategy.POLLING,
  sampleData: {
    code: 100,
    data: {
      callback_id: null,
      caption_url: 'https://example.com/caption.ass',
      created_at: 1748528913,
      duration: 1.234,
      error: null,
      gif_url: 'https://example.com/preview.gif',
      id: 'video_123',
      status: 'completed',
      thumbnail_url: 'https://example.com/thumbnail.jpg',
      video_url: 'https://example.com/video.mp4',
      video_url_caption: null
    },
    message: 'Success'
  },
  onEnable: async (context) => {
    // No setup needed
  },
  onDisable: async (context) => {
    // No cleanup needed
  },
  run: async (context) => {
    const { video_id } = context.propsValue;
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.heygen.com/v1/video_status.get`,
        queryParams: {
          video_id: video_id,
        },
        headers: {
          'X-Api-Key': context.auth,
        },
      });

      // HeyGen returns code: 100 for success
      if (response.status === 200 && response.body.code === 100) {
        const videoData = response.body.data;

        // Only trigger if the video is completed
        if (videoData.status === 'completed') {
          return [
            {
              code: response.body.code,
              data: {
                callback_id: videoData.callback_id,
                caption_url: videoData.caption_url,
                created_at: videoData.created_at,
                duration: videoData.duration,
                error: videoData.error,
                gif_url: videoData.gif_url,
                id: videoData.id,
                status: videoData.status,
                thumbnail_url: videoData.thumbnail_url,
                video_url: videoData.video_url,
                video_url_caption: videoData.video_url_caption,
              },
              message: response.body.message,
            },
          ];
        }
      }
    } catch (error) {
      console.error('Error checking video status:', error);
      // Handle specific error cases
      const heygenError = error as HeyGenError;
      if (heygenError.status === 404) {
        console.error('Video not found or access denied');
      } else if (heygenError.status === 400) {
        console.error('Request limit exceeded or invalid request');
      } else if (heygenError.status === 424) {
        console.error('Invalid parameters');
      }
    }
    
    return [];
  },
  test: async (context) => {
    const { video_id } = context.propsValue;
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.heygen.com/v1/video_status.get`,
        queryParams: {
          video_id: video_id,
        },
        headers: {
          'X-Api-Key': context.auth,
        },
      });

      // HeyGen returns code: 100 for success
      if (response.body.code === 100) {
        const videoData = response.body.data;
        if (videoData.status === 'completed') {
          return [
            {
              code: response.body.code,
              data: {
                callback_id: videoData.callback_id,
                caption_url: videoData.caption_url,
                created_at: videoData.created_at,
                duration: videoData.duration,
                error: videoData.error,
                gif_url: videoData.gif_url,
                id: videoData.id,
                status: videoData.status,
                thumbnail_url: videoData.thumbnail_url,
                video_url: videoData.video_url,
                video_url_caption: videoData.video_url_caption,
              },
              message: response.body.message,
            },
          ];
        }
      }
    } catch (error) {
      console.error('Error in test:', error);
    }
    
    return [];
  },
});