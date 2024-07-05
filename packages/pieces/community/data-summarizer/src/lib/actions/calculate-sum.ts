import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';

export const calculateSum = createAction({
  name: 'calculateSum',
  displayName: 'Calculate Sum',
  description: 'Calculates the sum of a list of values.',
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
        sum: sum
    };
  },
});
