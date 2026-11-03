import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';

export const calculateSum = createAction({
  audience: 'both',
  name: 'calculateSum',
  classification: 'READ',
  displayName: 'Calculate Sum',
  description: 'Adds up a list of numbers.',
  aiMetadata: { description: 'Adds up an array of numeric values and returns the total. Use when you need a running total or aggregate of a collected list; prefer Calculate Average for the mean, Find Min and Max for the extremes, or Count Uniques for distinct-value counts. Every element must be coercible to a number (numeric strings are accepted) or the action throws listing the offending values and their positions; read-only and idempotent.', idempotent: true },
  props: {
    note: common.note,
    values: Property.Array({
      displayName: "Values",
      description: 'The numbers to add up. Text like "12.5" is read as a number.',
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
        sum: sum
    };
  },
});
