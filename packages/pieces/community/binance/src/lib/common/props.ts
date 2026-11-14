import { Property } from '@activepieces/pieces-framework';

export const symbolProp = Property.ShortText({
  displayName: 'Symbol',
  description: "Base asset then quote asset. Case, spaces and '/' are ignored.",
  placeholder: 'BTCUSDT',
  required: true,
});
