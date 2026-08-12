import { Property } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import {
  MssqlAuth,
  MssqlTable,
  mssqlConnect,
  mssqlGetColumns,
  mssqlGetTableMeta,
  mssqlGetTables,
} from '.';
import { isTiebreakType } from './cursor';

export const warningMarkdown = Property.MarkDown({
  value: `
  **DO NOT** paste dynamic values straight into the query text.
  \n
  Use **@name** placeholders in the query and put the values in the Parameters field, so they are sent separately and cannot cause **SQL injection**.`,
});

export const mssqlProps = {
  table: <R extends boolean = true>(required: R = true as R) =>
    Property.Dropdown<MssqlTable, R, typeof mssqlAuth>({
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
  // sortableOnly hides text/xml/geography and friends, which ORDER BY rejects --
  // offering them lets someone pick a column that errors on every single poll
  column: <R extends boolean = true>(
    displayName: string,
    description: string,
    required: R = true as R,
    sortableOnly = false
  ) =>
    Property.Dropdown<string, R, typeof mssqlAuth>({
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
          const target = table as { table_schema: string; table_name: string };
          // isTiebreakType is the cursor's own rule, so the dropdown cannot
          // offer a column the trigger would then refuse: it drops the types
          // that have no lossless text form (xml, sql_variant, the spatial
          // types) and the max types, which ORDER BY rejects and which a
          // DATA_TYPE string alone cannot distinguish from their sized form.
          const columns = sortableOnly
            ? (await mssqlGetTableMeta(pool, target)).columns
                .filter((column) => isTiebreakType(column))
                .map((column) => column.name)
            : await mssqlGetColumns(pool, target);
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
