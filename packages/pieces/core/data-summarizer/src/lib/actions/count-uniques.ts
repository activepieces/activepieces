import { createAction, Property } from '@activepieces/pieces-framework';
import { common } from '../common';
import { isNil } from '@activepieces/pieces-framework';

export const countUniques = createAction({
  audience: 'both',
  name: 'countUniques',
  classification: 'READ',
  displayName: 'Count Uniques',
  description: 'Counts the distinct entries in a list, optionally by chosen fields.',
  aiMetadata: { description: 'Counts how many distinct entries an array contains, comparing whole entries when Fields is left empty or only the chosen object keys when Fields is supplied. Use for cardinality or de-duplication checks; prefer Calculate Sum, Calculate Average, or Find Min and Max for numeric aggregation. Values need not be numeric, but in field mode any entry that is not an object, or an object holding none of the chosen keys, collapses into one shared bucket; read-only and idempotent.', idempotent: true },
  props: {
    note: common.note,
    values: Property.Array({
      displayName: "Values",
      description: 'The entries to count. Repeated entries are counted once.',
      required: true,
    }),
    fieldsExplanation: Property.MarkDown({
      value: "Counting a list of objects? Add field names below to compare only those fields. Leave empty to compare whole entries."
    }),
    fields: Property.Array({
      displayName: "Fields",
      description: 'Entries with none of these fields are counted as one.',
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