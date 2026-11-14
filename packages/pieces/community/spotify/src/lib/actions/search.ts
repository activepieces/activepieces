import { createAction, Property } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient, spotifyValidate } from '../common';
import { spotifyOutputSchemas } from '../output-schemas';

const ALLOWED_TYPES = ['album', 'artist', 'playlist', 'track', 'show', 'episode'];

function searchTypes(value: unknown): string[] {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  const mapped = raw.map((entry) => {
    if (entry === '' || entry === 'album') {
      return 'album';
    }
    if (typeof entry === 'string' && ALLOWED_TYPES.includes(entry.trim())) {
      return entry.trim();
    }
    throw new Error(`"${String(entry).slice(0, 30)}" is not a search type. Use ${ALLOWED_TYPES.join(', ')}.`);
  });
  const unique = Array.from(new Set(mapped));
  if (unique.length === 0) {
    throw new Error('Choose at least one result type.');
  }
  return unique;
}

function searchLimit(value: unknown): number | undefined {
  try {
    return spotifyValidate.optionalInteger({ value, field: 'Limit', min: 1, max: 50 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`${message} Development-mode Spotify apps return a 400 error above 10.`);
  }
}

function present<T>(items: (T | null)[] | undefined): T[] | undefined {
  return items?.filter((item): item is T => item !== null);
}

export default createAction({
  name: 'search',
  classification: 'SEARCH',
  displayName: 'Search',
  description: 'Searches for tracks, artists, albums, playlists, shows and episodes',
  audience: 'both',
  aiMetadata: {
    description: 'Searches the Spotify catalog by keyword and returns matching items, scoped to the object types you select (tracks, artists, albums, playlists, shows, episodes). Use it to resolve a name or phrase into Spotify URIs/IDs before playing, queueing or adding to a playlist. Development-mode Spotify apps return at most 10 results per type. Read-only and repeatable; supports limit/offset paging.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  outputSchema: spotifyOutputSchemas['search'],
  props: {
    search_text: Property.ShortText({
      displayName: 'Search Text',
      description: 'Words to look for, such as an artist or song name.',
      placeholder: 'Daft Punk',
      required: true,
    }),
    types: Property.StaticMultiSelectDropdown({
      displayName: 'Result Types',
      description: 'Kinds of items to return.',
      required: true,
      options: {
        options: [
          { label: 'Albums', value: 'album' },
          { label: 'Artists', value: 'artist' },
          { label: 'Playlists', value: 'playlist' },
          { label: 'Tracks', value: 'track' },
          { label: 'Podcasts', value: 'show' },
          { label: 'Episodes', value: 'episode' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Results per type; development-mode apps allow up to 10.',
      required: false,
      display: 'stepper',
      min: 1,
      max: 50,
      step: 1,
      defaultValue: 5,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'How many results to skip, up to 1,000.',
      required: false,
      advanced: true,
    }),
    market: spotifyCommon.market(),
  },
  propertyGroups: [
    { key: 'query', display: 'section', label: 'Search For', icon: 'filter', props: ['search_text', 'types'] },
    { key: 'results', display: 'section', label: 'Results', icon: 'sliders', props: ['limit'] },
  ],
  async run({ auth, propsValue }) {
    const types = searchTypes(propsValue.types);
    const limit = searchLimit(propsValue.limit);
    const offset = spotifyValidate.optionalInteger({ value: propsValue.offset, field: 'Offset', min: 0, max: 1000 });
    const market = spotifyValidate.market(propsValue.market);
    const client = makeClient({ auth });
    const res = await client.search({
      q: propsValue.search_text,
      type: types.join(','),
      limit,
      offset,
      market,
    });
    return {
      tracks: present(res.tracks?.items),
      artists: present(res.artists?.items),
      albums: present(res.albums?.items),
      playlists: present(res.playlists?.items),
      shows: present(res.shows?.items),
      episodes: present(res.episodes?.items),
    };
  },
});
