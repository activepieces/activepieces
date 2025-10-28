import { Property } from '@activepieces/pieces-framework';
import { OracleDbClient } from './client';
import { OracleDbAuth } from './types';

export const oracleDbProps = {
  tableName: () =>
    Property.Dropdown({
      displayName: 'Table Name',
      required: true,
      refreshers: [],
      options: async (propsValue) => {
        const auth = propsValue['auth'] as OracleDbAuth | undefined;

        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Please authenticate first',
            options: [],
          };
        }
        const client = new OracleDbClient(auth);
        const tables = await client.getTables();
        return {
          disabled: false,
          options: tables.map((table) => ({
            label: table.label,
            value: table.value,
          })),
        };
      },
    }),

  orderBy: () =>
    Property.Dropdown({
      displayName: 'Order By Column',
      description: 'Column that increases over time (ID or timestamp)',
      required: true,
      refreshers: ['tableName'],
      options: async (propsValue) => {
        const tableName = propsValue['tableName'] as string | undefined;
        const auth = propsValue['auth'] as OracleDbAuth | undefined;

        if (!auth || !tableName) {
          return {
            disabled: true,
            placeholder: 'Please select a table first',
            options: [],
          };
        }
        const client = new OracleDbClient(auth);
        const columns = await client.getColumns(tableName);
        return {
          disabled: false,
          options: columns.map((col: { label: string; value: string }) => ({
            label: col.label,
            value: col.value,
          })),
        };
      },
    }),
};
