import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_album_tracks',
  classification: 'SEARCH',
  displayName: 'Get Album Tracks',
  description: 'Lists the tracks of an album',
  audience: 'both',
  aiMetadata: {
    description: 'Lists the tracks of one album, given its ID, spotify:album: URI or open.spotify.com link. By default returns one page (limit up to 50, offset); enable All to page through every track. Read-only and repeatable.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['albumTracks'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'album', displayName: 'Album ID', required: true }),
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    all: spotifyCommon.all(),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'album', value: propsValue.id, label: 'Album ID' });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.collectAll({
        fetchPage: (offset) => client.getAlbumTracks({ id, limit: 50, offset, market }),
      });
      return { total: res.items.length, items: res.items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    return client.getAlbumTracks({ id, limit, offset, market });
  },
});
