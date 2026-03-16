import { createAction } from '@activepieces/pieces-framework';
import { defiLlamaRequest } from '../fantom-api';

interface FantomProtocol {
  id: string;
  name: string;
  symbol: string;
  tvl: number;
  chainTvls: Record<string, number>;
  chains: string[];
  category: string;
  description: string;
  url: string;
  twitter: string;
  change_1h: number;
  change_1d: number;
  change_7d: number;
}

export const getProtocolTvl = createAction({
  name: 'get_protocol_tvl',
  displayName: 'Get Protocol TVL',
  description: 'Fetch the current Total Value Locked (TVL) for the Fantom protocol from DeFiLlama.',
  props: {},
  async run() {
    const data = await defiLlamaRequest<FantomProtocol>('/protocol/fantom');
    return {
      name: data.name,
      symbol: data.symbol,
      tvl: data.tvl,
      category: data.category,
      chains: data.chains,
      chainTvls: data.chainTvls,
      change_1h: data.change_1h,
      change_1d: data.change_1d,
      change_7d: data.change_7d,
      description: data.description,
      url: data.url,
      twitter: data.twitter,
    };
  },
});
