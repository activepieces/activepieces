import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, userVideoDropdown } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteVideo = createAction({
  name: 'delete_video',
  displayName: 'Delete Video',
  description: 'Delete a video from Vimeo',
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