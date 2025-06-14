import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { heygenAuth } from '../../index';

interface HeyGenError extends Error {
  status?: number;
}

export const videoGenerationFailed = createTrigger({
  auth: heygenAuth,
  name: 'video_generation_failed',
  displayName: 'Video Generation Failed',
  description: 'Triggers when a video generation process fails',
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
      caption_url: null,
      duration: null,
      error: {
        code: 40119,
        detail: "Video is too long (> 3600.0s). Please upgrade your plan to generate longer videos",
        message: "Video is too long"
      },
      gif_url: null,
      id: 'video_123',
      status: 'failed',
      thumbnail_url: null,
      video_url: null,
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
        if (videoData.status === 'failed') {
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
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://api.heygen.com/v1/video_status.get`,
      queryParams: {
        id: video_id
      },
      headers: {
        'X-Api-Key': context.auth,
      },
    });

    if (response.status === 200) {
      const videoData = response.body.data;
      if (videoData.status === 'failed') {
        return [
          {
            code: response.body.code,
            data: {
              callback_id: videoData.callback_id,
              caption_url: videoData.caption_url,
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
    
    return [];
  },
}); 