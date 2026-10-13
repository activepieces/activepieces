import { createAction } from '@activepieces/pieces-framework';
import { youtubeAuth } from '../common/auth';
import { searchOutputSchema } from '../output-schemas';
import { youtubeSearchAction } from './search';

export const youtubeSearchYoutubeAction = createAction({
  auth: youtubeAuth,
  outputSchema: searchOutputSchema,
  name: 'search_youtube',
  classification: 'SEARCH',
  displayName: 'Search YouTube',
  description:
    'Search YouTube videos, channels, and playlists using the YouTube Data API search.list endpoint.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a free-text YouTube search across videos, channels and playlists, or restricted to one type, returning the matching IDs. Prefer List Channel Videos or List Trending Videos when either fits, because search costs a hundred times more quota and caps at 500 results. Video-only filters such as duration, definition and caption require Type to be Video. Read-only and idempotent.',
    idempotent: true,
  },
  props: youtubeSearchAction.props,
  run: youtubeSearchAction.run,
});
