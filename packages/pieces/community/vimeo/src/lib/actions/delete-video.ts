import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, userVideoDropdown } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteVideo = createAction({
  name: 'delete_video',
  displayName: 'Delete Video',
  description: 'Delete a video from Vimeo',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes a video from the authenticated user\'s Vimeo account, identified by its video ID. Use to remove content the user owns. This is destructive and not idempotent: the first call removes the video, and repeating it on an already-deleted ID has no further effect or errors.', idempotent: false },
  auth: vimeoAuth,
  props: {
    videoId: userVideoDropdown,
  },
  async run({ auth, propsValue }) {
    const { videoId } = propsValue;

    
    const response = await apiRequest({
      auth,
      path: `/videos/${videoId}`,
      method: HttpMethod.DELETE,
    });

    if(response.status === 204){
      return {
        success: true,
        message: `Video '${videoId}' deleted successfully`
      };
    }

    return {
      success: false,
      response
    };
  },
});