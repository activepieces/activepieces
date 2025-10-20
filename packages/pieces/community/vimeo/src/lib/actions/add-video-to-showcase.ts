import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, userVideoDropdown } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addVideoToShowcase = createAction({
  name: 'add_video_to_showcase',
  displayName: 'Add Video to Showcase',
  description: 'Adds an existing video to a user\'s showcase',
  auth: vimeoAuth,
  props: {
    videoId: userVideoDropdown,
    showcaseId: Property.Dropdown({
      displayName: 'Showcase ID',
      description: 'ID of the showcase to add the video to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await apiRequest({
          auth,
          path: '/me/albums',
          method: HttpMethod.GET,
          queryParams: {
            per_page: '100',
          },
        });

        const showcases = response.body.data.map((folder: any) => ({
          value: folder.uri.split('/').pop(),
          label: folder.name,
        }));

        return {
          options: showcases,
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { videoId, showcaseId } = propsValue;

    // require a access token with `edit` scope
    const response = await apiRequest({
      auth,
      path: `/me/albums/${showcaseId}/videos/${videoId}`,
      method: HttpMethod.PUT,
    });

    if(response.status === 204){
      return {
        success: true,
        message: `Video '${videoId}' added to showcase '${showcaseId}' successfully`
      };
    }

    return {
      success: false,
      response
    };
  },
});