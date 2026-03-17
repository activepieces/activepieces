import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

interface OHLCVPoint {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface CoinGeckoOHLCResponse extends Array<[number, number, number, number, number]> {}

export const getHistoricalPrices = createAction({
  name: 'get_historical_prices',
  displayName: 'Get RENDER Historical Prices',
  description:
    'Fetches historical OHLCV (open, high, low, close, volume) price data for the RENDER token via CoinGecko.',
  props: {
    days: Property.StaticDropdown({
      displayName: 'Time Range',
      description: 'Number of days of historical data to fetch.',
      required: true,
      defaultValue: '30',
      options: {
        options: [
          { label: '1 Day', value: '1' },
          { label: '7 Days', value: '7' },
          { label: '14 Days', value: '14' },
          { label: '30 Days', value: '30' },
          { label: '90 Days', value: '90' },
          { label: '180 Days', value: '180' },
          { label: '1 Year', value: '365' },
        ],
      },
    }),
  },
  async run(context) {
    const days = context.propsValue.days as string;

    const ohlcResponse = await httpClient.sendRequest<CoinGeckoOHLCResponse>({
      method: HttpMethod.GET,
      url: 'https://api.coingecko.com/api/v3/coins/render-token/ohlc',
      queryParams: {
        vs_currency: 'usd',
        days,
      },
    });

    const ohlcData: OHLCVPoint[] = ohlcResponse.body.map(([timestamp, open, high, low, close]) => ({
      timestamp,
      date: new Date(timestamp).toISOString().split('T')[0],
      open,
      high,
      low,
      close,
    })) as unknown as OHLCVPoint[];

    if (ohlcData.length === 0) {
      return {
        data: [],
        period_days: Number(days),
        data_points: 0,
        start_date: null,
        end_date: null,
        price_range: null,
      };
    }

    const closes = ohlcData.map((d) => d.close);
    const highs = ohlcData.map((d) => d.high);
    const lows = ohlcData.map((d) => d.low);

    return {
      data: ohlcData,
      period_days: Number(days),
      data_points: ohlcData.length,
      start_date: new Date(ohlcData[0].timestamp).toISOString().split('T')[0],
      end_date: new Date(ohlcData[ohlcData.length - 1].timestamp).toISOString().split('T')[0],
      price_range: {
        highest_close: Math.max(...closes),
        lowest_close: Math.min(...closes),
        absolute_high: Math.max(...highs),
        absolute_low: Math.min(...lows),
        open_price: ohlcData[0].open,
        close_price: ohlcData[ohlcData.length - 1].close,
      },
    };
  },
});
