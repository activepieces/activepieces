import { createAction, Property } from '@activepieces/pieces-framework';
import { binanceClient } from '../common/client';
import { binanceInput } from '../common/input';
import { symbolProp } from '../common/props';
import { getCandlesOutputSchema } from '../output-schemas';

const DEFAULT_LIMIT = 100;

const INTERVAL_OPTIONS = [
  { label: '1 second', value: '1s' },
  { label: '1 minute', value: '1m' },
  { label: '3 minutes', value: '3m' },
  { label: '5 minutes', value: '5m' },
  { label: '15 minutes', value: '15m' },
  { label: '30 minutes', value: '30m' },
  { label: '1 hour', value: '1h' },
  { label: '2 hours', value: '2h' },
  { label: '4 hours', value: '4h' },
  { label: '6 hours', value: '6h' },
  { label: '8 hours', value: '8h' },
  { label: '12 hours', value: '12h' },
  { label: '1 day', value: '1d' },
  { label: '3 days', value: '3d' },
  { label: '1 week', value: '1w' },
  { label: '1 month', value: '1M' },
];

export const getCandles = createAction({
  name: 'get_candles',
  classification: 'READ',
  displayName: 'Get Candles (Klines)',
  description: 'Get open, high, low, close and volume candles of a Binance spot trading pair at a chosen interval.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets OHLCV candlesticks (klines) for one Binance spot pair at an interval from 1s to 1M, either the most recent ones (optionally ending at an end time) or those from a start time onwards (optionally up to an end time). Use for price history, charts or indicators; use Get Price Change (Rolling Window) when only the change over one period is needed. At most 1000 candles per call; when a start time is given and more candles follow, hasMore is true and nextStartTime is where to continue. Prices and volumes are exact decimal strings. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    symbol: symbolProp,
    interval: Property.StaticDropdown({
      displayName: 'Interval',
      description: 'Length of each candle. 1m is one minute and 1M is one month.',
      required: true,
      defaultValue: '1h',
      options: {
        disabled: false,
        options: INTERVAL_OPTIONS,
      },
    }),
    start_time: Property.DateTime({
      displayName: 'Start Time',
      description:
        'Optional. Return candles that open at or after this time (UTC), for example 2026-09-01T00:00:00Z. Leave empty to get the most recent candles.',
      required: false,
    }),
    end_time: Property.DateTime({
      displayName: 'End Time',
      description: 'Optional. Return candles that open at or before this time (UTC). Must not be earlier than the start time.',
      required: false,
    }),
    time_zone: Property.ShortText({
      displayName: 'Time Zone Offset',
      description:
        'Optional. Offset from UTC used to align daily and longer candles, such as 8, -5 or 05:45 (from -12:00 to +14:00). Start and end times are always read as UTC. Defaults to UTC.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Number of Candles',
      description: 'How many candles to return, 1 to 1000. Defaults to 100.',
      required: false,
      defaultValue: DEFAULT_LIMIT,
    }),
  },
  outputSchema: getCandlesOutputSchema,
  async run(context) {
    const { propsValue } = context;
    const symbol = binanceInput.symbol({ value: propsValue.symbol });
    const interval = binanceInput.klineInterval({ value: propsValue.interval });
    const startTime = binanceInput.epochMs({ value: propsValue.start_time, fieldName: 'Start Time' });
    const endTime = binanceInput.epochMs({ value: propsValue.end_time, fieldName: 'End Time' });
    const timeZone = binanceInput.timeZone({ value: propsValue.time_zone });
    const limit = binanceInput.limit({ value: propsValue.limit, min: 1, max: 1000, defaultValue: DEFAULT_LIMIT, fieldName: 'Number of Candles' });
    if (startTime !== undefined && endTime !== undefined && startTime > endTime) {
      throw new Error('Start Time must be earlier than End Time.');
    }
    const rows = await binanceClient.get<KlineRow[]>({
      path: '/klines',
      queryParams: {
        symbol,
        interval,
        limit: String(limit),
        ...(startTime === undefined ? {} : { startTime: String(startTime) }),
        ...(endTime === undefined ? {} : { endTime: String(endTime) }),
        ...(timeZone === undefined ? {} : { timeZone }),
      },
      subject: `the trading pair "${symbol}"`,
      timeoutMs: binanceClient.SLOW_TIMEOUT_MS,
    });
    const candles = rows.map((row) => toCandle({ row }));
    const last = candles.at(-1);
    const rangeEnd = endTime ?? Date.now();
    const hasMore = startTime !== undefined && last !== undefined && candles.length === limit && last.closeTime < rangeEnd;
    return {
      symbol,
      interval,
      candles,
      count: candles.length,
      hasMore,
      nextStartTime: hasMore && last !== undefined ? last.closeTime + 1 : null,
    };
  },
});

function toCandle({ row }: { row: KlineRow }) {
  const [openTime, open, high, low, close, volume, closeTime, quoteVolume, tradeCount, takerBuyBaseVolume, takerBuyQuoteVolume] = row;
  return { openTime, open, high, low, close, volume, closeTime, quoteVolume, tradeCount, takerBuyBaseVolume, takerBuyQuoteVolume };
}

type KlineRow = [number, string, string, string, string, string, number, string, number, string, string, string];
