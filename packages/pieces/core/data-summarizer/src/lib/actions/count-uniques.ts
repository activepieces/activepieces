import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';
import { isNil } from '@activepieces/shared';

export const countUniques = createAction({
  name: 'countUniques',
  displayName: 'Count Uniques',
  description: 'Counts the number of unique values for multiple fields',
  props: {
    note: common.note,
    values: Property.Array({
      displayName: "Values",
      required: true,
    }),
    fieldsExplanation: Property.MarkDown({
      value: "If the data you're passing in is an object, you can specify certain fields to filter on. The object will be discarded if the fields don't exist. Otherwise, leave fields empty."
    }),
    fields: Property.Array({
      displayName: "Fields",
      required: false
    })
  },
  async run({ propsValue }) {
    const values = propsValue.values;
    const unknownFields = propsValue.fields != undefined && propsValue.fields.length > 0 ? propsValue.fields : null;
    const fields = validateFields(unknownFields)
    return {
      numUniques: numUniques(values, fields)
    };
  },
});

function validateFields(fields: unknown[] | null): string[] | null {
  if (!isNil(fields) && Array.isArray(fields) && fields.every(value => typeof value === 'string')) {
    return fields as string[]
  }
  else return null
}

function numUniques<T>(values: T[], fields: string[] | null = null) {
  if (isNil(fields)) {
    return new Set(values.map(value => JSON.stringify(value))).size
  }
  const newValues = values.map(value => {
    const obj: { [k: string]: unknown } = {}
    if (typeof value !== 'object') {
      return obj
    }
    for (const key in value) {
      if (fields.includes(key)) {
        obj[key] = value[key]
      }
    }
    return obj
  })
  return new Set(newValues.map(value => JSON.stringify(value))).size
}