import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { SavedItemType } from '../common/client';
import { spotifyOutputSchemas } from '../output-schemas';

function savedType(value: unknown): SavedItemType {
  if (value === 'albums' || value === 'shows' || value === 'episodes') {
    return value;
  }
  throw new Error('Item Type must be Albums, Podcasts or Episodes. For saved tracks use Get Saved Tracks.');
}

export default createAction({
  name: 'get_saved_items',
  classification: 'SEARCH',
  auth: spotifyCommon.authentication,
  displayName: 'Get Saved Items',
  description: 'Lists the albums, shows (podcasts) or episodes saved in your library',
  audience: 'both',
  aiMetadata: {
    description: "Lists the albums, shows or episodes saved in the current user's library, newest first. For saved tracks (Liked Songs) use Get Saved Tracks. By default returns one page (limit/offset); enable All to page through everything (up to 5,000). Read-only and repeatable.",
    idempotent: true,
  },
  outputSchema: spotifyOutputSchemas['savedItems'],
  props: {
    type: Property.StaticDropdown<string>({
      displayName: 'Item Type',
      required: true,
      display: 'cards',
      defaultValue: 'albums',
      options: {
        options: [
          { label: 'Albums', value: 'albums', description: 'Saved albums' },
          { label: 'Podcasts', value: 'shows', description: 'Followed podcasts' },
          { label: 'Episodes', value: 'episodes', description: 'Saved episodes' },
        ],
      },
    }),
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: 50, defaultHint: 20 }),
    all: spotifyCommon.all(),
    paging_note: spotifyCommon.pagingNote(),
    market: spotifyCommon.market(),
  },
  propertyGroups: [
    { key: 'library', display: 'section', label: 'Library', icon: 'inbox', props: ['type'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['limit', 'all', 'paging_note'] },
  ],
  async run({ auth, propsValue }) {
    const type = savedType(propsValue.type);
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.getAllSavedItems({ type, market });
      return { total: res.items.length, items: res.items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: 50 });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    return client.getSavedItems({ type, limit, offset, market });
  },
});
