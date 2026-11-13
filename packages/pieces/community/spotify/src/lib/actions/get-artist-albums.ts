import { Property, createAction } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyIds } from '../common/ids';
import { spotifyOutputSchemas } from '../output-schemas';

const GROUPS = ['album', 'single', 'appears_on', 'compilation'];
const MAX_LIMIT = 10;
const ALL_MAX_PAGES = 100;

function includeGroups(value: unknown): string | undefined {
  const raw = Array.isArray(value) ? value : [];
  const groups = raw.map((entry) => {
    if (typeof entry === 'string' && GROUPS.includes(entry)) {
      return entry;
    }
    throw new Error(`"${String(entry).slice(0, 30)}" is not an album type. Use ${GROUPS.join(', ')}.`);
  });
  const unique = Array.from(new Set(groups));
  return unique.length === 0 ? undefined : unique.join(',');
}

export default createAction({
  name: 'get_artist_albums',
  classification: 'SEARCH',
  displayName: 'Get Artist Albums',
  description: "Lists an artist's albums, singles, compilations and appearances",
  audience: 'both',
  aiMetadata: {
    description: "Lists the releases of one artist (ID, spotify:artist: URI or open.spotify.com link), optionally only some album types (album, single, appears_on, compilation). By default returns one page (limit up to 10, Spotify's maximum for this endpoint, plus offset); enable All to page through up to 1,000 releases. Read-only and repeatable.",
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['artistAlbums'],
  props: {
    id: spotifyCommon.catalogId({ kind: 'artist', displayName: 'Artist ID', required: true }),
    include_groups: Property.StaticMultiSelectDropdown({
      displayName: 'Album Types',
      description: 'Empty returns every type.',
      required: false,
      options: {
        options: [
          { label: 'Albums', value: 'album' },
          { label: 'Singles', value: 'single' },
          { label: 'Appears On', value: 'appears_on' },
          { label: 'Compilations', value: 'compilation' },
        ],
      },
    }),
    offset: spotifyCommon.offset(),
    limit: spotifyCommon.limit({ max: MAX_LIMIT, defaultHint: 5 }),
    all: spotifyCommon.all({ maxItems: MAX_LIMIT * ALL_MAX_PAGES }),
    paging_note: spotifyCommon.pagingNote(),
    market: spotifyCommon.market(),
  },
  propertyGroups: [
    { key: 'artist', display: 'section', label: 'Artist', icon: 'user', props: ['id', 'include_groups'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['limit', 'all', 'paging_note'] },
  ],
  async run({ auth, propsValue }) {
    const id = spotifyIds.parse({ kind: 'artist', value: propsValue.id, label: 'Artist ID' });
    const groups = includeGroups(propsValue.include_groups);
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    if (spotifyValidate.isYes(propsValue.all)) {
      const res = await client.collectAll({
        fetchPage: (offset) => client.getArtistAlbums({ id, include_groups: groups, limit: MAX_LIMIT, offset, market }),
        maxPages: ALL_MAX_PAGES,
      });
      return { total: res.items.length, items: res.items, has_more: res.hasMore };
    }
    const limit = spotifyValidate.optionalInteger({ value: propsValue.limit, field: 'Limit', min: 1, max: MAX_LIMIT });
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0 });
    return client.getArtistAlbums({ id, include_groups: groups, limit, offset, market });
  },
});
