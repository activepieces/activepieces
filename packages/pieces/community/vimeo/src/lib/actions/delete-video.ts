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
    videoId: Property.Dropdown({
      displayName: 'Video ID',
      description: 'Video to be deleted',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await apiRequest({
          auth,
          path: '/me/videos',
          method: HttpMethod.GET,
          queryParams: {
            per_page: '100',
          },
        });

        const videos = response.body.data.map((video: any) => ({
          value: video.uri.split('/').pop(),
          label: video.name,
        }));

        return {
          options: videos,
        };
      },
    })
  },
  async run({ auth, propsValue }) {
    const { videoId } = propsValue;

    // require a access token with `delete` scope
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