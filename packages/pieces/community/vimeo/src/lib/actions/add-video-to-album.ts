import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const addVideoToAlbum = createAction({
  name: 'add-video-to-album',
  displayName: 'Add Video to Album',
  description: 'Adds an existing video to a user\'s album',
  props: {
    videoUri: Property.ShortText({
      displayName: 'Video URI',
      description: 'The URI of the video to add to the album (e.g., /videos/123456789)',
      required: true,
    }),
    albumUri: Property.ShortText({
      displayName: 'Album URI',
      description: 'The URI of the album to add the video to (e.g., /users/me/albums/123456789)',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user who owns the album (leave empty to use authenticated user)',
      required: false,
    }),
  },
  async run(context) {
    const { videoUri, albumUri, userId } = context.propsValue;

    if (!videoUri) {
      throw new Error('Video URI is required');
    }

    if (!albumUri) {
      throw new Error('Album URI is required');
    }

    // Determine the endpoint URL
    const endpoint = userId 
      ? `https://api.vimeo.com/users/${userId}/albums/${albumUri.split('/').pop()}/videos`
      : `https://api.vimeo.com/me/albums/${albumUri.split('/').pop()}/videos`;

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.PUT,
        url: endpoint,
        headers: {
          'Authorization': `Bearer ${(context.auth as any).access_token}`,
          'Content-Type': 'application/json',
        },
        body: {
          video_uri: videoUri,
        },
      });

      if (response.status === 200 || response.status === 204) {
        return {
          success: true,
          message: 'Video successfully added to album',
          videoUri,
          albumUri,
        };
      } else {
        throw new Error(`Failed to add video to album with status ${response.status}: ${response.body}`);
      }
    } catch (error) {
      throw new Error(`Failed to add video to album: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
