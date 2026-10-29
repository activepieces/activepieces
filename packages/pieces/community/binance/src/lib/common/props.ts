import { Property } from '@activepieces/pieces-framework';

export const symbolProp = Property.ShortText({
  displayName: 'Symbol',
  description:
    "The trading pair: base asset followed by quote asset, for example BTCUSDT or ETHBTC. Spaces and '/' are removed and letters are upper-cased, so 'btc/usdt' also works. Use List Trading Pairs to find a symbol.",
  required: true,
});
