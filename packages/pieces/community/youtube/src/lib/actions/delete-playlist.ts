import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { deletePlaylistOutputSchema } from '../output-schemas';
import { youtubeClient } from '../common/client';

export const youtubeDeletePlaylistAction = createAction({
  auth: youtubeAuth,
  outputSchema: deletePlaylistOutputSchema,
  name: 'delete_playlist',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Playlist',
  description: 'Permanently delete a playlist owned by the connected account.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a playlist owned by the authenticated channel via playlists.delete. Use Remove Video From Playlist when only one entry should go; this removes the whole playlist and cannot be undone. A repeated call fails because the playlist no longer exists.',
    idempotent: false,
  },
  props: {
    playlistId: Property.ShortText({
      displayName: 'Playlist ID',
      description:
        'The playlist to delete. This is the `list` parameter in a playlist URL.',
      required: true,
    }),
  },
  async run(context) {
    const accessToken = context.auth.access_token;
    const { playlistId } = context.propsValue;

    await youtubeClient.sendRequest({
      accessToken,
      method: HttpMethod.DELETE,
      path: '/playlists',
      operation: 'Delete Playlist',
      queryParams: { id: playlistId },
    });

    return { success: true, playlistId };
  },
});
