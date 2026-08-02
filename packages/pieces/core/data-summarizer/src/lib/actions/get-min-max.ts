import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';

export const getMinMax = createAction({
  audience: 'both',
  name: 'getMinMax',
  displayName: 'Find Min and Max',
  description: 'Get the smallest and greatest values from a list of numeric values.',
  aiMetadata: { description: 'Returns both the smallest and the largest number from an array of numeric values in a single call. Use when you need the range or the extremes of a collected list; prefer Calculate Sum for a total, Calculate Average for the mean, or Count Uniques for distinct-value counts. Every element must be coercible to a number (numeric strings are accepted) or the action throws listing the offending values and their positions, and an empty list returns max -Infinity and min Infinity; read-only and idempotent.', idempotent: true },
  props: {
    note: common.note,
    values: Property.Array({
      displayName: 'Values',
      required: true
    })
  },
  async run({ propsValue }) {
    const result = common.validateArray(propsValue.values);
    if (result.hasError) 
      throw new Error(JSON.stringify(result.error));
    return {
      max: Math.max(...result.values),
      min: Math.min(...result.values)
    };
  }
});
