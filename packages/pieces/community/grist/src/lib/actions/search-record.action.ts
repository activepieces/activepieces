import { gristAuth } from '../..';
import {
  createAction,
  DropdownOption,
  PiecePropValueSchema,
  Property,
} from '@activepieces/pieces-framework';
import { commonProps } from '../common/props';
import { GristAPIClient } from '../common/helpers';

import { HttpMethod } from '@activepieces/pieces-common';

export const gristSearchRecordAction = createAction({
  auth: gristAuth,
  name: 'grist-search-record',
  displayName: 'Search Record',
  description: 'Search record by matching criteria.',
  props: {
    workspace_id: commonProps.workspace_id,
    document_id: commonProps.document_id,
    table_id: commonProps.table_id,
    column: Property.Dropdown({
      displayName: 'Column',
      refreshers: ['document_id', 'table_id'],
      required: true,
      options: async ({ auth, document_id, table_id }) => {
        if (!auth || !document_id || !table_id) {
          return {
            disabled: true,
            placeholder: 'Please connect account and select document.',
            options: [],
          };
        }

        const authValue = auth as PiecePropValueSchema<typeof gristAuth>;

        const client = new GristAPIClient({
          domainUrl: authValue.domain,
          apiKey: authValue.apiKey,
        });

        const response = await client.listTableColumns(
          document_id as string,
          table_id as string
        );

        const options: DropdownOption<string>[] = [];
        for (const column of response.columns) {
          options.push({ value: column.id, label: column.fields.label });
        }
        return {
          disabled: false,
          options,
        };
      },
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
      description:
        'Enter the search text. The search operation is case sensitive, exact text match, and supports column-type Text only.',
    }),
  },
  async run(context) {
    const documentId = context.propsValue.document_id;
    const tableId = context.propsValue.table_id;
    const columnName = context.propsValue.column;
    const columnValue = context.propsValue.value;

    const client = new GristAPIClient({
      domainUrl: context.auth.domain,
      apiKey: context.auth.apiKey,
    });

    const encodedQuery = encodeURIComponent(
      JSON.stringify({
        [columnName]: [columnValue],
      })
    );

    return await client.makeRequest(
      HttpMethod.GET,
      `/docs/${documentId}/tables/${tableId}/records?filter=${encodedQuery}`
    );
  },
});
