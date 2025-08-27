import {
  createAction,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { vimeoCommon } from '../common/common';

export const addVideoToShowcase = createAction({
  auth: vimeoAuth,
  name: 'addVideoToShowcase',
  displayName: 'Add video to showcase',
  description: "Add an existing video to a user's showacase (previously album)",
  props: {
    showcaseId: Property.ShortText({
      displayName: 'Showcase ID',
      description: 'ID of the showcase to add the video to',
      required: true,
    }),
    videoId: Property.ShortText({
      displayName: 'Video ID',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as OAuth2PropertyValue;
    const vimeo = vimeoCommon.getClient({ auth });

    const { showcaseId, videoId } = context.propsValue;
    if (!videoId) throw new Error('Invalid video ID or URL');

    try {
      const response = await vimeo.request({
        method: 'PUT',
        path: `/albums/${showcaseId}/videos/${videoId}`,
      });

      if (response.statusCode === 204) {
        return { success: true, message: 'Video was added.' };
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
          'Improper scopes, or user can not add videos to the showcase'
        );
      }
      if (err.message?.includes('429') || err?.error?.code === 9000) {
        throw new Error(
          'Rate limit exceeded. Please try again in a few seconds.'
        );
      }

      throw new Error(
        `Failed to add video to showcase: ${err.message || 'Unknown error'}`
      );
    }
  },
});
