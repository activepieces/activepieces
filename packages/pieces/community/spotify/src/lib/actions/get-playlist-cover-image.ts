import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_playlist_cover_image',
  classification: 'READ',
  displayName: 'Get Playlist Cover Image',
  description: 'Gets the cover image URLs of a playlist',
  audience: 'both',
  aiMetadata: {
    description: 'Returns the cover image URLs (with sizes) of one playlist, given its ID, spotify:playlist: URI or open.spotify.com link. The URLs expire after a while, so download them soon. Read-only and repeatable.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['coverImage'],
  props: {
    playlist_id: spotifyCommon.playlist_id(true),
  },
  async run({ auth, propsValue }) {
    const playlistId = spotifyIds.parse({ kind: 'playlist', value: propsValue.playlist_id, label: 'Playlist' });
    const client = makeClient({ auth });
    return { images: await client.getPlaylistCoverImage({ playlistId }) };
  },
});
