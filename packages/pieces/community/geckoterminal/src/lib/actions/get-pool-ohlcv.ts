import { createAction, Property } from '@activepieces/pieces-framework';
import { geckoTerminalApiCall } from '../geckoterminal-api';

const NETWORKS = [
  { label: 'Ethereum', value: 'eth' },
  { label: 'Solana', value: 'solana' },
  { label: 'BNB Smart Chain', value: 'bsc' },
  { label: 'Base', value: 'base' },
  { label: 'Arbitrum', value: 'arbitrum' },
  { label: 'Polygon', value: 'polygon' },
  { label: 'Avalanche', value: 'avax' },
  { label: 'Optimism', value: 'optimism' },
];

const TIMEFRAMES = [
  { label: 'Day', value: 'day' },
  { label: 'Hour', value: 'hour' },
  { label: 'Minute', value: 'minute' },
];

export const getPoolOhlcvAction = createAction({
  name: 'get-pool-ohlcv',
  displayName: 'Get Pool OHLCV',
  description: 'Get OHLCV (Open/High/Low/Close/Volume) candlestick data for a DEX pool.',
  props: {
    network: Property.StaticDropdown({
      displayName: 'Network',
      description: 'The blockchain network the pool is on.',
      required: true,
      options: {
        options: NETWORKS,
      },
    }),
    address: Property.ShortText({
      displayName: 'Pool Address',
      description: 'The contract address of the pool.',
      required: true,
    }),
    timeframe: Property.StaticDropdown({
      displayName: 'Timeframe',
      description: 'Candlestick timeframe granularity.',
      required: true,
      options: {
        options: TIMEFRAMES,
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of OHLCV records to return (max 1000).',
      required: false,
      defaultValue: 100,
    }),
  },
  async run(context) {
    const { network, address, timeframe, limit } = context.propsValue;
    return await geckoTerminalApiCall(
      `/networks/${network}/pools/${address}/ohlcv/${timeframe}`,
      { limit: limit ?? 100 }
    );
  },
});
