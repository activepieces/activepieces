import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../auth';
import { elementTypeProperty, generateElementFields, propText } from '../common';
import { queryRecordsSchema } from '../output-schemas';
import {
  assertModuleName,
  buildWhere,
  clampLimit,
  filterValueToString,
  pagedQuery,
  VtqlFilter,
} from '../vtql';
import { vtwsLogin, vtwsQuery } from '../vtws';

const SEARCH_MAX = 1000;

export function searchFiltersFromFields(fields: Record<string, unknown>): VtqlFilter[] {
  return Object.entries(fields).flatMap(([field, value]): VtqlFilter[] => {
    if (value === false || value === '') {
      return [];
    }
    const text = filterValueToString(value);
    if (text === undefined) {
      return [];
    }
    return [{ field, value: text, operator: typeof value === 'string' ? 'LIKE' : '=' }];
  });
}

export const searchRecords = createAction({
  name: 'search_records',
  classification: 'SEARCH',
  auth: vtigerAuth,
  displayName: 'Search Records',
  description: 'Search for a record.',
  audience: 'human',
  aiMetadata: {
    description:
      'Searches a Vtiger module (element type) by field-value criteria; text fields match case-insensitive substrings and other fields match exactly. Leaving the criteria empty returns all records up to the limit. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: queryRecordsSchema,
  props: {
    elementType: elementTypeProperty,
    fields: Property.DynamicProperties({
      auth: vtigerAuth,
      displayName: 'Search Fields',
      description: 'Enter your filter criteria. Unchecked checkboxes are ignored.',
      required: true,
      refreshers: ['elementType'],
      props: async ({ auth, elementType }) => {
        const module = propText(elementType);
        if (!auth || module === '') {
          return {};
        }
        return generateElementFields({ auth, elementType: module, defaultValue: {}, skipMandatory: true });
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: `Enter the maximum number of records to return (default and maximum ${SEARCH_MAX}).`,
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const module = assertModuleName(propText(propsValue.elementType));
    const limit = clampLimit({ value: propsValue.limit, fallback: SEARCH_MAX, max: SEARCH_MAX });
    const where = buildWhere({ filters: searchFiltersFromFields(propsValue.fields ?? {}) });
    const session = await vtwsLogin(auth.props);
    const { records } = await pagedQuery<Record<string, unknown>>({
      module,
      where,
      limit,
      fetchPage: (query) => vtwsQuery<Record<string, unknown>>({ creds: auth.props, session, query }),
    });
    return records;
  },
});
