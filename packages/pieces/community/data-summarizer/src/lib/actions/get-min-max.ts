import { createAction, Property } from '@activepieces/pieces-framework';
import { checkValueIsNumber, ErrorInfo, ValueInfo } from '../common'

export const getMinMax = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getMinMax',
  displayName: 'Min/Max',
  description: 'Gets the smallest and greatest values from a list of values',
  props: {
    note: Property.MarkDown({
      displayName: "Note",
      description: "If you'd like to use the values with a previous step, click the X first."
    }),
    values: Property.Array({
      displayName: 'Values',
      description: 'Enter your values here',
      required: true
    })
  },
  async run({ propsValue }) {
    const values = propsValue.values;
    const first = values[0];
    let res = checkValueIsNumber(first, 0);
    if (!res.isNumber) {
      return res.info
    }
    let min = res.value;
    let max = res.value;

    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      res = checkValueIsNumber(value, i)
      if (!res.isNumber) {
        return res.info
      }
      max = Math.max(max, res.value);
      min = Math.min(min, res.value);
    }

    return {
      max: max,
      min: min
    };
  }
});
