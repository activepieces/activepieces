import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';

export const calculateAverage = createAction({
  audience: 'both',
  name: 'calculateAverage',
  displayName: 'Calculate Average',
  description: 'Calculates the average of a list of values.',
  aiMetadata: { description: 'Computes the arithmetic mean of an array of numeric values. Use when you need the average of a collected list; prefer Calculate Sum for a total, Find Min and Max for the extremes, or Count Uniques for distinct-value counts. Every element must be coercible to a number (numeric strings are accepted) or the action throws listing the offending values and their positions, and an empty list yields NaN; read-only and idempotent.', idempotent: true },
  props: {
    note: common.note,
    values: Property.Array({
      displayName: "Values",
      required: true,
    })
  },
  async run({ propsValue }) {
    const result = common.validateArray(propsValue.values);
    if (result.hasError) {
      throw new Error(JSON.stringify(result.error));
    }
    const sum = result.values.reduce((acc, value) => acc + value, 0);
    return {
      average: sum / result.values.length
    };
  },
});
