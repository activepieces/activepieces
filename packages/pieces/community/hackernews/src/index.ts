import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { fetchTopStoriesAction } from './lib/actions/fetch-top-stories';

export const hackernews = createPiece({
  displayName: 'Hacker News',
  description: 'A social news website',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/hackernews.png',
  auth: PieceAuth.None(),
  categories: [],
  authors: ["kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [fetchTopStoriesAction],
  triggers: [],
});
