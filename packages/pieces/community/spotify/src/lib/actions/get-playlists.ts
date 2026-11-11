import { createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

export default createAction({
  name: 'get_playlists',
  classification: 'SEARCH',
  displayName: 'Get Playlists',
  description: 'Retrieves the list of playlists that you created or followed',
  audience: 'both',
  aiMetadata: {
    description: "Lists the current user's own and followed playlists. Use it to discover a playlist's id before reading, updating, or modifying it. By default returns one page (limit/offset); enable All to page through every playlist (up to 5,000) in one call. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['playlists'],
  props: {
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    all: spotifyCommon.all(),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.getAllCurrentUserPlaylists();
      return { total: res.items.length, items: res.items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    const page = await client.getCurrentUserPlaylists({ limit, offset });
    return { ...page, items: page.items.filter((item) => item !== null) };
  },
});
