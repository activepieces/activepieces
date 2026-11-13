import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_saved_tracks',
  classification: 'SEARCH',
  displayName: 'Get Saved Tracks',
  description: 'Retrieves the list of saved tracks for the current user',
  audience: 'both',
  aiMetadata: {
    description: "Lists the tracks in the current user's Liked Songs, newest first. For saved albums, shows or episodes use Get Saved Items instead. By default returns one page (limit/offset); enable All to page through every saved track (up to 5,000) in one call. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['savedTracks'],
  props: {
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    all: spotifyCommon.all(),
    paging_note: spotifyCommon.pagingNote(),
    market: spotifyCommon.market(),
  },
  async run({ auth, propsValue }) {
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.getAllSavedTracks({ market });
      return { total: res.items.length, items: res.items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    return client.getSavedTracks({ limit, offset, market });
  },
});
