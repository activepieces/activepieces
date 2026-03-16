import { createAction, Property } from '@activepieces/pieces-framework';
import { birdeyeAuth } from '../../index';
import { birdeyeRequest } from '../common/birdeye-api';
import { CHAIN_OPTIONS } from '../common/chain-dropdown';

const INTERVAL_OPTIONS = [
  { label: '1 Minute', value: '1m' },
  { label: '3 Minutes', value: '3m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '30 Minutes', value: '30m' },
  { label: '1 Hour', value: '1H' },
  { label: '2 Hours', value: '2H' },
  { label: '4 Hours', value: '4H' },
  { label: '6 Hours', value: '6H' },
  { label: '8 Hours', value: '8H' },
  { label: '12 Hours', value: '12H' },
  { label: '1 Day', value: '1D' },
  { label: '3 Days', value: '3D' },
  { label: '1 Week', value: '1W' },
  { label: '1 Month', value: '1M' },
];

export const getOhlcvData = createAction({
  auth: birdeyeAuth,
  name: 'get_ohlcv_data',
  displayName: 'Get OHLCV Data',
  description: 'Fetch historical Open-High-Low-Close-Volume candlestick data for a token with configurable time intervals.',
  props: {
    address: Property.ShortText({
      displayName: 'Token Address',
      description: 'The token contract address (or mint address for Solana)',
      required: true,
    }),
    chain: Property.StaticDropdown({
      displayName: 'Chain',
      description: 'The blockchain network to query',
      required: true,
      options: { options: CHAIN_OPTIONS },
      defaultValue: 'solana',
    }),
    type: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Candlestick interval',
      required: true,
      options: { options: INTERVAL_OPTIONS },
      defaultValue: '1D',
    }),
    time_from: Property.Number({
      displayName: 'Start Time (Unix)',
      description: 'Start of time range as Unix timestamp (seconds)',
      required: false,
    }),
    time_to: Property.Number({
      displayName: 'End Time (Unix)',
      description: 'End of time range as Unix timestamp (seconds). Defaults to now.',
      required: false,
    }),
  },
  async run(context) {
    const now = Math.floor(Date.now() / 1000);
    const params: Record<string, string | number | undefined> = {
      address: context.propsValue.address,
      address_type: 'token',
      type: context.propsValue.type as string,
      chain: context.propsValue.chain as string,
      time_from: context.propsValue.time_from ?? now - 86400,
      time_to: context.propsValue.time_to ?? now,
    };
    return birdeyeRequest(context.auth, '/defi/ohlcv', params);
  },
});
