import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const deleteVideoAction = createAction({
  auth: vimeoAuth,
  name: 'delete-video',
  displayName: 'Delete Video',
  description: 'Permanently delete a video from the user\'s account',
  props: {
    videoUri: Property.ShortText({
      displayName: 'Video URI',
      description: 'The URI of the video to delete (e.g., /videos/123456789 or just the video ID)',
      required: true,
    }),
    confirmDeletion: Property.Checkbox({
      displayName: 'Confirm Deletion',
      description: 'I understand that this action will permanently delete the video and cannot be undone',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new VimeoClient(auth);
    let { videoUri, confirmDeletion } = propsValue;
    
    if (!confirmDeletion) {
      throw new Error('You must confirm the deletion by checking the confirmation box');
    }
    
    // Normalize URI
    if (!videoUri.startsWith('/videos/')) {
      videoUri = `/videos/${videoUri}`;
    }
    
    try {
      await client.deleteVideo(videoUri);
      
      return {
        success: true,
        message: `Video ${videoUri} deleted successfully`,
        deletedVideoUri: videoUri,
      };
    } catch (error) {
      throw new Error(`Failed to delete video: ${error}`);
    }
  },
});
