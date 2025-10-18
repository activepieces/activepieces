import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../auth';
import { apiRequest, userFolderDropdown, userVideoDropdown } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const addVideoToFolder = createAction({
  name: 'add_video_to_folder',
  displayName: 'Add Video to Folder',
  description: 'Adds an existing video to a user\'s folder',
  auth: vimeoAuth,
  props: {
    videoId: userVideoDropdown,
    folderId: userFolderDropdown,
  },
  async run({ auth, propsValue }) {
    const { videoId, folderId } = propsValue;

    if (!folderId) throw new Error("Folder selection is required. Please select a folder to add the video to.");

    // require a access token with `interact` scope
    const response = await apiRequest({
      auth,
      path: `/me/projects/${folderId}/videos/${videoId}`,
      method: HttpMethod.PUT,
    });

    if(response.status === 204){
      return {
        success: true,
        message: `Video '${videoId}' added to folder '${folderId}' successfully`
      };
    }

    return {
      success: false,
      response
    };
  },
});