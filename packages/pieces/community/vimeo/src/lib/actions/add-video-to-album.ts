import { createAction, Property } from '@activepieces/pieces-framework';
import { vimeoAuth } from '../common/auth';
import { VimeoClient } from '../common/client';

export const addVideoToAlbumAction = createAction({
  auth: vimeoAuth,
  name: 'add-video-to-album',
  displayName: 'Add Video to Album',
  description: 'Add an existing video to a user\'s album',
  props: {
    videoUri: Property.ShortText({
      displayName: 'Video URI',
      description: 'The URI of the video to add (e.g., /videos/123456789 or just the video ID)',
      required: true,
    }),
    albumUri: Property.ShortText({
      displayName: 'Album URI',
      description: 'The URI of the album (e.g., /me/albums/123456 or just the album ID)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new VimeoClient(auth);
    let { videoUri, albumUri } = propsValue;
    
    // Normalize URIs
    if (!videoUri.startsWith('/videos/')) {
      videoUri = `/videos/${videoUri}`;
    }
    
    if (!albumUri.startsWith('/me/albums/')) {
      if (albumUri.startsWith('/albums/')) {
        albumUri = `/me${albumUri}`;
      } else {
        albumUri = `/me/albums/${albumUri}`;
      }
    }
    
    try {
      await client.addVideoToAlbum(albumUri, videoUri);
      
      return {
        success: true,
        message: `Video ${videoUri} added to album ${albumUri} successfully`,
        videoUri,
        albumUri,
      };
    } catch (error) {
      throw new Error(`Failed to add video to album: ${error}`);
    }
  },
});
