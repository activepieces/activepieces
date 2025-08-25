import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const deleteVideo = createAction({
  name: 'delete-video',
  displayName: 'Delete Video',
  description: 'Permanently deletes one or more videos from your Vimeo account',
  props: {
    videoUris: Property.Array({
      displayName: 'Video URIs',
      description: 'List of video URIs to delete (comma-separated)',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: 'The ID of the user who owns the videos (leave empty to use authenticated user)',
      required: false,
    }),
  },
  async run(context) {
    const { videoUris, userId } = context.propsValue;

    if (!videoUris || videoUris.length === 0) {
      throw new Error('At least one video URI is required');
    }

    // Convert array to comma-separated string
    const urisParam = videoUris.join(',');

    // Determine the endpoint URL
    const endpoint = userId 
      ? `https://api.vimeo.com/users/${userId}/videos`
      : 'https://api.vimeo.com/me/videos';

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: endpoint,
        queryParams: {
          uris: urisParam,
        },
        headers: {
          'Authorization': `Bearer ${(context.auth as any).access_token}`,
        },
      });

      if (response.status === 204) {
        return {
          success: true,
          message: `Successfully deleted ${videoUris.length} video(s)`,
          deletedUris: videoUris,
        };
      } else {
        throw new Error(`Delete failed with status ${response.status}: ${response.body}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete videos: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
});
