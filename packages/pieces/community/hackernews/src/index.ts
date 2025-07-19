import { PieceAuth, createPiece } from '@ensemble/pieces-framework';
import { fetchTopStories } from './lib/actions/top-stories-in-hacker-news';

export const hackernews = createPiece({
  displayName: 'Hacker News',
  description: 'A social news website',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/hackernews.png',
  auth: PieceAuth.None(),
  categories: [],
  authors: ["kishanprmr","AbdulTheActivePiecer","khaledmashaly","abuaboud"],
  actions: [fetchTopStories],
  triggers: [],
});
