import { createAction, Property } from '@activepieces/pieces-framework';
import { checkValueIsNumber, ErrorInfo, ValueInfo } from '../common'

export const calculateSum = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'calculateSum',
  displayName: 'Calculate Sum',
  description: 'Calculates the sum of a list of values',
  props: {
    note: Property.MarkDown({
      displayName: "Note",
      description: "If you'd like to use the values with a previous step, click the X first."
    }),
    values: Property.Array({
      displayName: "Values",
      description: "Enter your values here",
      required: true,
    })
  },
  async run({ propsValue }) {
    const values = propsValue.values;
    let sum = 0

    for (let i = 0; i < values.length; i++) {
        const value = values[i]
        const res = checkValueIsNumber(value, i)
        if (!res.isNumber) {
          return res.info
        }
        sum += res.value
    }

    return {
        sum: sum
    }
  },
});
