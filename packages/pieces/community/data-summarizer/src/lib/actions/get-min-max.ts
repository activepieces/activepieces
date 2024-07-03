import { createAction, Property } from '@activepieces/pieces-framework';

export const getMinMax = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'getMinMax',
  displayName: 'Min/Max',
  description: 'Gets the smallest and greatest values from a list of values',
  props: {
    values: Property.Array({
      displayName: 'Values',
      description: 'Enter your values here',
      required: true
    })
  },
  async run({ propsValue }) {
    const values = propsValue.values;
    let first = values[0];
    if (typeof first === 'string') {
      const parse = parseInt(first);
      if (!Number.isNaN(parse)) first = parse;
    }
    if (typeof first !== 'number') {
      return {
        error: `Failed to get the min/max values; invalid type given for value #1.
                Expected type number, received (${typeof first})`,
        first: first
      };
    }
    let min = first;
    let max = first;

    for (const index in values) {
      let value = values[index];
      if (typeof value === 'string') {
        const parse = parseInt(value);
        if (!Number.isNaN(parse)) value = parse;
      }
      if (typeof value !== 'number') {
        return {
          error: `Failed to get the min/max values; invalid type given for value #${index + 1}.
                Expected type number, received (${typeof value})`,
          value: value
        };
      }
      max = Math.max(max, value);
      min = Math.min(min, value);
    }

    return {
      max: max,
      min: min
    };
  }
});
