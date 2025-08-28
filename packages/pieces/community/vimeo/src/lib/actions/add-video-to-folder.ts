import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addVideoToFolder = createAction({
  name: 'add_video_to_folder',
  displayName: 'Add Video to Folder',
  description: 'Adds an existing video to a user\'s folder',
  auth: vimeoAuth,
  props: {
    videoId: Property.ShortText({
      displayName: 'Video ID',
      description: 'ID of the video to add to the folder',
      required: true,
    }),
    folderId: Property.Dropdown({
      displayName: 'Folder ID',
      description: 'ID of the folder to add the video to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        const response = await apiRequest({
          auth,
          path: '/me/folders',
          method: HttpMethod.GET,
          queryParams: {
            per_page: '100',
          },
        });

        const folders = response.body.data.map((folder: any) => ({
          value: folder.uri.split('/').pop(),
          label: folder.name,
        }));

        return {
          options: folders,
        };
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { videoId, folderId } = propsValue;

    // require a access token with `interact` scope
    const response = await apiRequest({
      auth,
      path: `/me/projects/${folderId}/videos/${videoId}`,
      method: HttpMethod.PUT,
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