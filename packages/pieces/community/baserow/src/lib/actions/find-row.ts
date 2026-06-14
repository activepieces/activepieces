import {
  Property,
  createAction,
  DropdownState,
} from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { baserowCommon, makeClient } from '../common';
import { BaserowFieldType } from '../common/constants';

export const findRowAction = createAction({
  name: 'baserow_find_row',
  displayName: 'Find Row',
  description:
    'Finds a row by matching a field value. Returns the first match.',
  audience: 'both',
  aiMetadata: {
    description:
      'Looks up the first row in a Baserow table whose chosen field exactly equals a given value. Use to resolve a row from a known field value (e.g. an email or external key) when you do not have its row ID; for ID lookups use Get Row, and for multi-condition or partial-text queries use List Rows. The match field must be a filterable type (link, multi-select, file, formula/lookup, and date-type fields are excluded). Read-only and idempotent.',
    idempotent: true,
  },
  auth: baserowAuth,
  props: {
    table_id: baserowCommon.tableId(),
    field_name: Property.Dropdown({
      displayName: 'Field',
      description: 'Select the field to search by.',
      required: true,
      auth: baserowAuth,
      refreshers: ['auth', 'table_id'],
      options: async ({ auth, table_id }): Promise<DropdownState<string>> => {
        if (!auth || typeof table_id !== 'number') {
          return {
            disabled: true,
            placeholder: 'Select a table first.',
            options: [],
          };
        }
        const client = await makeClient(auth);
        const fields = await client.listTableFields(table_id);
        const unsupportedTypes: string[] = [
          BaserowFieldType.LINK_TO_TABLE,
          BaserowFieldType.MULTI_SELECT,
          BaserowFieldType.MULTIPLE_COLLABORATORS,
          BaserowFieldType.FILE,
          BaserowFieldType.ROLLUP,
          BaserowFieldType.LOOKUP,
          BaserowFieldType.COUNT,
          BaserowFieldType.LAST_MODIFIED_BY,
          BaserowFieldType.CREATED_BY,
          BaserowFieldType.DATE,
          BaserowFieldType.LAST_MODIFIED,
          BaserowFieldType.CREATED_ON,
          BaserowFieldType.DURATION,
        ];
        const filterable = fields.filter(
          (f) => !unsupportedTypes.includes(f.type)
        );
        return {
          disabled: false,
          options: filterable.map((f) => ({
            label: f.name,
            value: `field_${f.id}`,
          })),
        };
      },
    }),
    field_value: Property.ShortText({
      displayName: 'Field Value',
      description: 'The value to search for (exact match).',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, field_name, field_value } = context.propsValue;
    if (!field_name || !field_value) {
      return { found: false, row: null, count: 0 };
    }
    const client = await makeClient(context.auth);
    const response = (await client.listRows(
      table_id!,
      undefined,
      1,
      undefined,
      undefined,
      { [`filter__${field_name}__equal`]: field_value }
    ))

    if (response.results.length === 0) {
      return { found: false, count: 0 };
    }
    return { found: true, count: response.count, ...response.results[0] };
  },
});
