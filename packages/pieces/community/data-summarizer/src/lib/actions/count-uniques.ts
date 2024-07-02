import { createAction, Property } from '@activepieces/pieces-framework';

export const countUniques = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'countUniques',
  displayName: 'count uniques',
  description: 'counts the number of unique values of multiple fields',
  props: {
    values: Property.Array({
      displayName: "Values",
      description: "Enter your values here",
      required: true, 
    })
  },
  async run({ propsValue }) {
    const values = propsValue.values
    return {
      values: values,
      numUniques: numUniques(values)
    }
  },
});

function numUniques(values: unknown[]): number {
  return new Set(values).size
}