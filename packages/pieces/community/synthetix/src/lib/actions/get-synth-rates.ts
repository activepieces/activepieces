import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const RATES_SUBGRAPH = 'https://api.thegraph.com/subgraphs/name/synthetixio-team/synthetix-rates';

const QUERY = `
  query GetSynthRates {
    synthRates(orderBy: timestamp, orderDirection: desc, first: 100) {
      id
      synth
      rate
      timestamp
    }
  }
`;

interface RatesData {
  synthRates: {
    id: string;
    synth: string;
    rate: string;
    timestamp: string;
  }[];
}

export const getSynthRates = createAction({
  name: 'get_synth_rates',
  displayName: 'Get Synth Rates',
  description: 'Fetch current exchange rates for sUSD, sBTC, sETH, and other synths',
  auth: undefined,
  props: {},
  async run() {
    const response = await httpClient.sendRequest<{ data: RatesData; errors?: unknown[] }>({
      method: HttpMethod.POST,
      url: RATES_SUBGRAPH,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: QUERY }),
    });

    if (response.body.errors && response.body.errors.length > 0) {
      throw new Error(`Synthetix rates subgraph error: ${JSON.stringify(response.body.errors)}`);
    }

    return {
      rates: response.body.data.synthRates.map((r) => ({
        synth: r.synth,
        rate: r.rate,
        timestamp: new Date(parseInt(r.timestamp) * 1000).toISOString(),
      })),
    };
  },
});
