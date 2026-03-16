import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { getLatestNews } from './lib/actions/get-latest-news';
import { getHotNews } from './lib/actions/get-hot-news';
import { getCoinNews } from './lib/actions/get-coin-news';
import { getBullishPosts } from './lib/actions/get-bullish-posts';
import { getBearishPosts } from './lib/actions/get-bearish-posts';

export const cryptoPanicAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'CryptoPanic API key (optional, for more data). Leave blank to use public access.',
  required: false,
});

export const cryptopanic = createPiece({
  displayName: 'CryptoPanic',
  description: 'Get the latest crypto news and sentiment from CryptoPanic',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/cryptopanic.png',
  categories: [PieceCategory.FINANCE],
  auth: cryptoPanicAuth,
  actions: [
    getLatestNews,
    getHotNews,
    getCoinNews,
    getBullishPosts,
    getBearishPosts,
  ],
  authors: ['bossco7598'],
  triggers: [],
});
