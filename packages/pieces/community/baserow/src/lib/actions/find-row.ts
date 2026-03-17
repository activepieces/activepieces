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
  description: 'Finds a row by matching a field value.',
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
        if (!auth || !table_id) {
          return { disabled: true, placeholder: 'Select a table first.', options: [] };
        }
        const client = makeClient(auth.props);
        const fields = await client.listTableFields(table_id as unknown as number);
        // Only show fields that support the "equal" filter lookup
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
        ];
        const filterable = fields.filter((f) => !unsupportedTypes.includes(f.type));
        return {
          disabled: false,
          options: filterable.map((f) => ({ label: f.name, value: `field_${f.id}` })),
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
    const { table_id, field_name, field_value } = context.propsValue as {
      table_id: number;
      field_name: string;
      field_value: string;
    };
    if (!field_name || !field_value) {
      return { found: false, row: null };
    }
    const client = makeClient(context.auth.props);
    const response = await client.listRows(
      table_id,
      undefined,
      1,
      undefined,
      undefined,
      { [`filter__${field_name}__equal`]: field_value }
    ) as { results: Record<string, unknown>[]; count: number };

    if (response.results.length === 0) {
      return { found: false, row: null };
    }
    return { found: true, row: response.results[0] };
  },
});
