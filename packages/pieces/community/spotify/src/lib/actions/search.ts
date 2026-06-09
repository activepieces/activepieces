import { createAction, Property } from '@activepieces/pieces-framework';
import { spotifyCommon, makeClient } from '../common';

export default createAction({
  name: 'search',
  displayName: 'Search',
  description: 'Searches for tracks, artists, albums, etc.',
  audience: 'both',
  aiMetadata: {
    description: 'Searches the Spotify catalog by keyword and returns matching items, scoped to the object types you select (tracks, artists, albums, playlists). Use it to resolve a name or phrase into Spotify URIs/IDs before playing or adding to a playlist. Read-only and repeatable; supports limit/offset paging.',
    idempotent: true,
  },
  auth: spotifyCommon.authentication,
  props: {
    search_text: Property.ShortText({
      displayName: 'Search Text',
      description: 'The word or phrase you are searching for',
      required: true,
    }),
    types: Property.StaticMultiSelectDropdown({
      displayName: 'Object Types',
      required: true,
      options: {
        options: [
          { label: 'Albums', value: '' },
          { label: 'Artists', value: 'artist' },
          { label: 'Playlists', value: 'playlist' },
          { label: 'Tracks', value: 'track' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = makeClient({ auth });
    const res = await client.search({
      q: propsValue.search_text,
      type: propsValue.types.join(','),
      limit: propsValue.limit,
      offset: propsValue.offset,
    });
    const result = {
      tracks: res.tracks?.items,
      artists: res.artists?.items,
      albums: res.albums?.items,
      playlists: res.playlists?.items,
    };
    return result;
  },
});
