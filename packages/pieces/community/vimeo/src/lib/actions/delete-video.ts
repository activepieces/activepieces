import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/common';

export const deleteVideo = createAction({
  auth: vimeoAuth,
  name: 'deleteVideo',
  displayName: 'Delete Video',
  description: 'Delete a video from your vimeo account',
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'ID of the video to delete',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const vimeo = vimeoCommon.getClient({ auth });

    // validate video id
    const segments = (context.propsValue.videoId as string).split('/');
    const videoId = segments[segments.length - 1].match(/\d+/)?.[0];
    
    if (!videoId) throw new Error('Invalid video ID');

    try {
      const response = await vimeo.request({
        method: 'DELETE',
        path: `/videos/${videoId}`,
      });

      if (response.statusCode === 204) {
        return { success: true, message: 'Video deleted successfully.' };
      }

      return {
        success: false,
        message: `Unexpected Vimeo response: ${response.statusCode}`,
        response,
      };
    } catch (err: any) {
      console.error('Vimeo delete error', err);

      if (err.message?.includes('403')) {
        throw new Error(
          'Forbidden: You do not have permission to delete this video.'
        );
      }
      if (err.message?.includes('429') || err?.error?.code === 9000) {
        throw new Error(
          'Rate limit exceeded. Please try again in a few seconds.'
        );
      }

      throw new Error(
        `Failed to delete video: ${err.message || 'Unknown error'}`
      );
    }
  },
});
