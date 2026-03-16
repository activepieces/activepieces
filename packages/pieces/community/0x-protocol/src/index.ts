import { createPiece, PieceAuth, PieceCategory } from '@activepieces/pieces-framework';
import { getPrice } from './lib/actions/get-price';
import { getQuote } from './lib/actions/get-quote';
import { getSources } from './lib/actions/get-sources';
import { getOrderbookOrders } from './lib/actions/get-orderbook-orders';
import { getTokenPriceUsd } from './lib/actions/get-token-price-usd';

export const zeroExAuth = PieceAuth.SecretText({
  displayName: '0x API Key',
  description:
    'Your 0x Protocol API key. Get a free key at https://dashboard.0x.org/',
  required: true,
});

export const zeroExProtocol = createPiece({
  displayName: '0x Protocol',
  description:
    'Aggregates liquidity from all major DEXes to find the best swap prices. Access price quotes, executable swap calldata, and open orderbook orders across Ethereum, Polygon, BNB, Arbitrum, Optimism, Base, and Avalanche.',
  auth: zeroExAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/0x-protocol.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['bossco7598'],
  actions: [
    getPrice,
    getQuote,
    getSources,
    getOrderbookOrders,
    getTokenPriceUsd,
  ],
  triggers: [],
});
