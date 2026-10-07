import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { listPlaylistsOutputSchema } from '../output-schemas';
import { youtubeListPlaylistsAction } from './list-playlists';

export const youtubeListChannelPlaylistsAction = createAction({
  auth: youtubeAuth,
  outputSchema: listPlaylistsOutputSchema,
  name: 'list_channel_playlists',
  classification: 'SEARCH',
  displayName: 'List Channel Playlists',
  description: 'List the playlists on a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the playlists belonging to a YouTube channel, returning each playlist title, description, item count and privacy status. Use it to discover a playlist ID before List Playlist Videos, Add Video To Playlist or Update Playlist. A channel ID starting with UC is required; resolve a handle with Get Channel Details first. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeListPlaylistsAction.props,
  run: youtubeListPlaylistsAction.run,
});
