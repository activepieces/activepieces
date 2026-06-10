import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';

export const getMinMax = createAction({
  name: 'getMinMax',
  displayName: 'Find Min and Max',
  description: 'Get the smallest and greatest values from a list of numeric values.',
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
