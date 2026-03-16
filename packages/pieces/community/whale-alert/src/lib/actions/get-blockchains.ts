import { createAction } from '@activepieces/pieces-framework';
import { whaleAlertAuth } from '../../index';

export const SUPPORTED_BLOCKCHAINS = [
  {
    name: 'Bitcoin',
    symbol: 'bitcoin',
    native_currency: 'BTC',
    supported_symbols: ['btc'],
  },
  {
    name: 'Ethereum',
    symbol: 'ethereum',
    native_currency: 'ETH',
    supported_symbols: ['eth', 'usdt', 'usdc', 'weth', 'link', 'uni', 'shib', 'matic', 'busd'],
  },
  {
    name: 'Ripple (XRP)',
    symbol: 'ripple',
    native_currency: 'XRP',
    supported_symbols: ['xrp'],
  },
  {
    name: 'Tron',
    symbol: 'tron',
    native_currency: 'TRX',
    supported_symbols: ['trx', 'usdt', 'usdd'],
  },
  {
    name: 'Cardano',
    symbol: 'cardano',
    native_currency: 'ADA',
    supported_symbols: ['ada'],
  },
  {
    name: 'Solana',
    symbol: 'solana',
    native_currency: 'SOL',
    supported_symbols: ['sol', 'usdc', 'usdt'],
  },
  {
    name: 'Litecoin',
    symbol: 'litecoin',
    native_currency: 'LTC',
    supported_symbols: ['ltc'],
  },
  {
    name: 'Bitcoin Cash',
    symbol: 'bitcoin_cash',
    native_currency: 'BCH',
    supported_symbols: ['bch'],
  },
  {
    name: 'Dogecoin',
    symbol: 'dogecoin',
    native_currency: 'DOGE',
    supported_symbols: ['doge'],
  },
  {
    name: 'Polygon',
    symbol: 'polygon',
    native_currency: 'MATIC',
    supported_symbols: ['matic', 'usdt', 'usdc'],
  },
  {
    name: 'Algorand',
    symbol: 'algorand',
    native_currency: 'ALGO',
    supported_symbols: ['algo', 'usdc'],
  },
];

export const getBlockchains = createAction({
  auth: whaleAlertAuth,
  name: 'get_blockchains',
  displayName: 'Get Supported Blockchains',
  description: 'Returns a list of all blockchains supported by Whale Alert with their native currencies and tracked symbols.',
  props: {},
  async run() {
    return {
      result: 'ok',
      blockchains: SUPPORTED_BLOCKCHAINS,
      count: SUPPORTED_BLOCKCHAINS.length,
    };
  },
});
