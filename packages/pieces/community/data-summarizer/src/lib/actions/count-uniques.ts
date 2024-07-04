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
      required: true, 
    }),
    fieldsExplanation: Property.MarkDown({ 
      value: "If the data you're passing in is an object, you can specify certain fields to filter on!"
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

function validateFields(fields: unknown[]|null): string[]|null {
  if (fields === null) 
    return null
  if (fields.every(value => typeof value === 'string')) {
    return fields as string[]
  }
  else return null
}

function numUniques<T>(values: T[], fields: string[]|null = null) {
  if (fields != null) {
      const map = values.map(value => {
          if (typeof value !== 'object') return value
          const obj: {[k: string]: any} = {}
          for (const key in value) {
              if (fields.includes(key)) {
                  obj[key] = value[key]
              }
          }
          if (Object.keys(obj).length === 0) {
              return undefined
          }
          return obj
      })
      const filter = map.filter(value => value !== undefined)
      if (filter.length !== 0) 
          values = filter as T[]
      else 
          return null
  }
  return new Set(values.map(value => JSON.stringify(value))).size
}