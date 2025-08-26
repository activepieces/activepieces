import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addVideoToShowcase = createAction({
  name: 'add_video_to_showcase',
  displayName: 'Add Video to Showcase',
  description: 'Adds an existing video to a user\'s showcase',
  auth: vimeoAuth,
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'ID of the video to add to the showcase',
      required: true,
    }),
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

    if(!/^\d+$/m.test(videoId)) throw new Error("Video ID must be a number");
    if(!/^\d+$/m.test(showcaseId)) throw new Error("Showcase ID must be a number");

    // require a access token with `edit` scope
    let response = await apiRequest({
      auth,
      path: `/albums/${showcaseId}/videos/${videoId}`,
      method: HttpMethod.PUT,
    });

    if(response.status > 200 && response.status < 300){
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