import { createAction, Property } from '@activepieces/pieces-framework';

export const calculateAverage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'calculateAverage',
  displayName: 'Calculate Average',
  description: 'Calculates the average of a list of values',
  props: {
    values: Property.Array({
      displayName: "Values",
      description: "Enter your values here",
      required: true,
    })
  },
  async run({ propsValue }) {
    const values = propsValue.values;
    let sum = 0

    for (const index in values) {
        let value = values[index]
        if (typeof value === 'string') {
          const parse = parseInt(value)
          if (!Number.isNaN(parse)) value = parse
        }
        if (typeof value !== 'number') {
            return {
                error: `Failed to calculate average; invalid type given for value #${index + 1}.
                Expected type number, received (${typeof value})`,
                value: value,
            }
        }
        sum += value
    }

    return {
        average: sum / values.length
    }
  },
});
