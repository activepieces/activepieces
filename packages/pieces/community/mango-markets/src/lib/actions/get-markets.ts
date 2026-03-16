import { createAction } from '@activepieces/pieces-framework';

export const getMarkets = createAction({
  name: 'get_markets',
  displayName: 'Get Markets',
  description: 'Get a list of all available trading markets on Mango Markets (spot + perpetuals).',
  auth: undefined,
  props: {},
  async run() {
    const response = await fetch('https://api.mngo.cloud/data/v4/markets');
    if (!response.ok) {
      throw new Error(`Mango API error: ${response.status}`);
    }
    const data = await response.json();

    const markets = Array.isArray(data) ? data : (data.markets ?? []);
    return {
      count: markets.length,
      markets: markets.map((m: Record<string, unknown>) => ({
        name: m.name ?? m.market ?? null,
        baseSymbol: m.baseCurrency ?? m.baseSymbol ?? m.base ?? null,
        quoteSymbol: m.quoteCurrency ?? m.quoteSymbol ?? m.quote ?? null,
        marketType: m.marketType ?? (String(m.name ?? '').endsWith('-PERP') ? 'perpetual' : 'spot'),
        publicKey: m.publicKey ?? m.address ?? null,
      })),
    };
  },
});
