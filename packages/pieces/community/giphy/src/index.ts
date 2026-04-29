import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { giphyAuth } from './lib/auth';
import { getGifsByIdAction } from './lib/actions/get-gifs-by-id';
import { randomGifAction } from './lib/actions/random-gif';
import { searchGifsAction } from './lib/actions/search-gifs';
import { translateGifAction } from './lib/actions/translate-gif';
import { trendingGifsAction } from './lib/actions/trending-gifs';
import { getGifByIdAction } from './lib/actions/get-gif-by-id';
import { randomStickerAction } from './lib/actions/random-sticker';
import { searchStickersAction } from './lib/actions/search-stickers';
import { translateStickerAction } from './lib/actions/translate-sticker';
import { trendingStickersAction } from './lib/actions/trending-stickers';

export const giphy = createPiece({
  displayName: 'Giphy',
  description: 'Giphy API',
  auth: giphyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/giphy.png',
  authors: [],
  actions: [
    getGifsByIdAction,
    randomGifAction,
    searchGifsAction,
    translateGifAction,
    trendingGifsAction,
    getGifByIdAction,
    randomStickerAction,
    searchStickersAction,
    translateStickerAction,
    trendingStickersAction,
  ],
  triggers: [],
});
