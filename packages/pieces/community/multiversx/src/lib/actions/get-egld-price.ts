import { createAction } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getEgldPrice = createAction({
  name: 'get_egld_price',
  displayName: 'Get EGLD Price',
  description:
    'Fetch the current price, market cap, and 24h change for EGLD (eGold) from CoinGecko.',
  props: {},
  async run() {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/elrond-erd-2',
      queryParams: {
        localization: 'false',
        tickers: 'false',
        community_data: 'false',
        developer_data: 'false',
        sparkline: 'false',
      },
    });

    const data = response.body as Record<string, unknown>;
    const marketData = data['market_data'] as Record<string, unknown> | undefined;
    const currentPrice = marketData?.['current_price'] as Record<string, number> | undefined;
    const marketCap = marketData?.['market_cap'] as Record<string, number> | undefined;
    const priceChange24h = marketData?.['price_change_percentage_24h'] as number | undefined;
    const totalVolume = marketData?.['total_volume'] as Record<string, number> | undefined;
    const circulatingSupply = marketData?.['circulating_supply'] as number | undefined;
    const totalSupply = marketData?.['total_supply'] as number | undefined;
    const ath = marketData?.['ath'] as Record<string, number> | undefined;

    return {
      id: data['id'],
      symbol: data['symbol'],
      name: data['name'],
      price_usd: currentPrice?.['usd'],
      market_cap_usd: marketCap?.['usd'],
      price_change_24h_percent: priceChange24h,
      total_volume_usd: totalVolume?.['usd'],
      circulating_supply: circulatingSupply,
      total_supply: totalSupply,
      ath_usd: ath?.['usd'],
      last_updated: (data['last_updated'] as string) ?? null,
    };
  },
});
