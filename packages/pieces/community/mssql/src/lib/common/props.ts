import { Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { MssqlAuth, mssqlConnect, mssqlGetColumns, mssqlGetTables } from '.';

export const warningMarkdown = Property.MarkDown({
  value: `
  **DO NOT** paste dynamic values straight into the query text.
  \n
  Use **@name** placeholders in the query and put the values in the Parameters field, so they are sent separately and cannot cause **SQL injection**.`,
});

export const mssqlProps = {
  table: (required = true) =>
    Property.Dropdown({
      auth: mssqlAuth,
      displayName: 'Table',
      description: 'The table to work with.',
      required,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect to your database first',
            options: [],
          };
        }
        const pool = await mssqlConnect(auth as MssqlAuth);
        try {
          const tables = await mssqlGetTables(pool);
          return {
            disabled: false,
            options: tables.map((table) => ({
              label: `${table.table_schema}.${table.table_name}`,
              value: table,
            })),
          };
        } finally {
          await pool.close();
        }
      },
    }),
  column: (displayName: string, description: string, required = true) =>
    Property.Dropdown({
      auth: mssqlAuth,
      displayName,
      description,
      required,
      refreshers: ['table'],
      options: async ({ auth, table }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect to your database first',
            options: [],
          };
        }
        if (!table) {
          return {
            disabled: true,
            placeholder: 'Please select a table first',
            options: [],
          };
        }
        const pool = await mssqlConnect(auth as MssqlAuth);
        try {
          const columns = await mssqlGetColumns(
            pool,
            table as { table_schema: string; table_name: string }
          );
          return {
            disabled: false,
            options: columns.map((column) => ({
              label: column,
              value: column,
            })),
          };
        } finally {
          await pool.close();
        }
      },
    }),
};
