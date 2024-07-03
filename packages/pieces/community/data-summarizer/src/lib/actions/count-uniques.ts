import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';

export const countUniques = createAction({
  name: 'countUniques',
  displayName: 'Count Uniques',
  description: 'Counts the number of unique values for multiple fields',
  props: {
    note: common.note,
    values: Property.Array({
      displayName: "Values",
      description: "Enter your values here",
      required: true, 
    }),
  },
  async run({ propsValue }) {
    const values = propsValue.values;
    return {
      values: values,
      numUniques: numUniques(values)
    };
  },
});

function numUniques(values: unknown[]): number {
  return new Set(values).size;
}