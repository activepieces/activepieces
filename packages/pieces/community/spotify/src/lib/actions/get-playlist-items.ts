import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_playlist_items',
  classification: 'SEARCH',
  displayName: 'Get Playlist Items',
  description: 'Retrieves the list of items in the playlist',
  audience: 'both',
  aiMetadata: {
    description: "Lists the tracks and episodes in a playlist, identified by its playlist id, URI or link. Each entry carries the media under both item and track. By default returns one page (limit/offset); enable All to page through every item (up to 5,000) in one call. Development-mode Spotify apps can only read playlists the user owns or collaborates on. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlistItems'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    all: spotifyCommon.all(),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.getAllPlaylistItems({ playlistId, market });
      return { total: res.items.length, items: res.items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    return client.getPlaylistItems({ playlistId, limit, offset, market });
  },
});
