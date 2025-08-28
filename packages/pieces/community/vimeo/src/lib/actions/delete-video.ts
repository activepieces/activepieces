import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const deleteVideo = createAction({
  name: 'delete_video',
  displayName: 'Delete Video',
  description: 'Delete a video from Vimeo',
  auth: vimeoAuth,
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'ID of the video to delete',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { videoId } = propsValue;

    // require a access token with `delete` scope
    const response = await apiRequest({
      auth,
      path: `/videos/${videoId}`,
      method: HttpMethod.DELETE,
    });

    if(response.status >= 200 && response.status < 300){
      return {
        success: true
      };
    }

    return {
      success: false,
      response
    };
  },
});