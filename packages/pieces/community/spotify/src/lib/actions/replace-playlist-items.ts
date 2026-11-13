import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'replace_playlist_items',
  classification: 'DESTRUCTIVE',
  displayName: 'Replace Playlist Items',
  description: 'Replaces everything in a playlist with the given tracks or episodes, or empties it',
  audience: 'both',
  aiMetadata: {
    description: "Overwrites the whole contents of a playlist with the given track/episode URIs (the old items are removed), or empties it when clear_all is true and no items are given. The first 100 items replace the playlist, the rest are appended in batches of 100. To add without removing, use Add items to playlist. Idempotent when it completes: the same list always gives the same playlist.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlistReplace'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
    items: Property.Array({
      displayName: 'Items',
      description: 'Track or episode URIs or links, in the order to keep.',
      required: false,
    }),
    clear_all: Property.Checkbox({
      displayName: 'Empty Playlist',
      description: 'Turn on with Items empty to remove every item.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const uris = spotifyIds.parseUriList({ value: propsValue.items, kinds: ['track', 'episode'], label: 'Items' });
    const clearAll = spotifyValidate.isYes(propsValue.clear_all);
    if (uris.length === 0 && !clearAll) {
      throw new Error('Items is empty. Give the items the playlist should contain, or turn on Empty Playlist to remove everything.');
    }
    if (uris.length > 0 && clearAll) {
      throw new Error('Empty Playlist is on but Items were given. Turn it off to replace the contents, or clear Items to empty the playlist.');
    }
    const client = makeClient({ auth });
    const res = await client.replacePlaylistItems({ playlistId, uris });
    return { playlist_id: playlistId, snapshot_id: res.snapshot_id, replaced: res.replaced, appended: res.appended };
  },
});
