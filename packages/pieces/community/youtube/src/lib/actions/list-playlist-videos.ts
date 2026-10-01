import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listPlaylistItemsOutputSchema } from '../output-schemas';
import { youtubeListPlaylistItemsAction } from './list-playlist-items';

export const youtubeListPlaylistVideosAction = createAction({
  auth: youtubeAuth,
  outputSchema: listPlaylistItemsOutputSchema,
  name: 'list_playlist_videos',
  classification: 'SEARCH',
  displayName: 'List Playlist Videos',
  description:
    'Returns videos in a YouTube playlist. You can filter by playlist ID or by specific item IDs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the entries of a YouTube playlist, either by playlist ID or by a comma-separated list of playlist item IDs, and is the source of the playlist item ID that Remove Video From Playlist needs. Use List Channel Playlists first when the playlist ID is unknown. Exactly one of Playlist ID or Item IDs is required and Max Results is capped at 50. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeListPlaylistItemsAction.props,
  run: youtubeListPlaylistItemsAction.run,
});
