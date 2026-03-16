import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const getProtocolStats = createAction({
  name: 'get_protocol_stats',
  displayName: 'Get Protocol Stats',
  description:
    'Get key protocol statistics for Sommelier Finance including TVL, chains count, and category from DeFiLlama.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{
      name: string;
      address: string;
      symbol: string;
      url: string;
      description: string;
      chain: string;
      logo: string;
      audits: string;
      audit_note: string | null;
      gecko_id: string;
      cmcId: string;
      category: string;
      chains: string[];
      tvl: number;
      currentChainTvls: Record<string, number>;
      raises: unknown[];
    }>({
      method: HttpMethod.GET,
      url: 'https://api.llama.fi/protocol/sommelier',
    });

    const data = response.body;

    return {
      name: data.name,
      symbol: data.symbol,
      category: data.category,
      description: data.description,
      url: data.url,
      logo: data.logo,
      totalTvlUsd: data.tvl,
      numberOfChains: data.chains?.length ?? 0,
      chains: data.chains,
      geckoId: data.gecko_id,
      hasAudits: data.audits !== '0',
    };
  },
});
