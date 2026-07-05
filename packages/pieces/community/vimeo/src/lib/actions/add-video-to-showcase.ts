import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, userVideoDropdown } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addVideoToShowcase = createAction({
  name: 'add_video_to_showcase',
  displayName: 'Add Video to Showcase',
  description: 'Adds an existing video to a user\'s showcase',
  audience: 'both',
  aiMetadata: { description: 'Adds an existing video the user owns to one of their Vimeo showcases (albums), identified by video ID and showcase ID. Use to organize already-uploaded videos into a curated showcase; it does not upload new content. Idempotent: the video is keyed into the showcase by ID, so re-running with the same pair leaves the membership unchanged. Requires a token with the edit scope.', idempotent: true },
  auth: vimeoAuth,
  props: {
    videoId: userVideoDropdown,
    showcaseId: Property.Dropdown({
      auth: vimeoAuth,
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