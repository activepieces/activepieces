import { Property } from '@activepieces/pieces-framework';

export const htsProp = Property.ShortText({
  displayName: 'HTS Code',
  description: 'HTS number, any length (e.g. 8541.10.00.80). Tariffs API does not classify products; supply a code you already have.',
  required: true,
});
export const originProp = (required: boolean) =>
  Property.ShortText({
    displayName: 'Country of Origin',
    description: 'ISO-2 country code (e.g. CN, MX, CA).',
    required,
  });
export const asOfProp = Property.ShortText({
  displayName: 'As Of',
  description: 'Date to price for, YYYY-MM-DD. Defaults to today.',
  required: false,
});
export const unknownDatesProp = Property.Checkbox({
  displayName: 'Include Unknown Effective Dates',
  description: 'Include measures whose effective dates are unknown (API default: true).',
  required: false,
  defaultValue: true,
});
