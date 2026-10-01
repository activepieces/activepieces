import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { removeVideoFromPlaylistOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeRemoveVideoFromPlaylistAction = createAction({
  auth: youtubeAuth,
  outputSchema: removeVideoFromPlaylistOutputSchema,
  name: 'remove_video_from_playlist',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Video From Playlist',
  description: 'Remove one entry from a playlist owned by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes a single entry from a playlist via playlistItems.delete. It takes the playlist item ID, not the video ID — get it from List Playlist Videos or from the output of Add Video To Playlist. Use Delete Playlist to remove the whole playlist; a repeated call fails because the entry is gone.',
    idempotent: false,
  },
  props: {
    playlistItemId: Property.ShortText({
      displayName: 'Playlist Item ID',
      description:
        'The playlist item ID (a long opaque string), not the video ID. Obtain it from List Playlist Videos or Add Video To Playlist.',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { playlistItemId } = context.propsValue;

    await youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.DELETE,
      path: '/playlistItems',
      operation: 'Remove Video From Playlist',
      queryParams: { id: playlistItemId },
    });

    return { success: true, playlistItemId };
  },
});
