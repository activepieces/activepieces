import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_playlist_info',
  classification: 'READ',
  displayName: 'Get Playlist Info',
  description: 'Retrieves details of a playlist',
  audience: 'both',
  aiMetadata: {
    description: 'Retrieves the details of a single playlist (name, description, owner, visibility, snapshot id and the first page of items) by its playlist id, URI or link. Use it to inspect playlist metadata once you have the id. Development-mode Spotify apps only return the items for playlists the user owns or collaborates on. Read-only and repeatable.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlist'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    return client.getPlaylist({ playlistId, market });
  },
});
