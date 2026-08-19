import { Property, isNil } from '@activepieces/pieces-framework';
import { mssqlAuth } from '../auth';
import { MssqlTable, mssqlCommon } from '.';
import { cursorUtils } from './cursor';

function asTable(value: unknown): MssqlTable | null {
  if (typeof value !== 'object' || isNil(value)) return null;
  if (!('table_schema' in value) || !('table_name' in value)) return null;
  const { table_schema, table_name } = value;
  return typeof table_schema === 'string' && typeof table_name === 'string'
    ? { table_schema, table_name }
    : null;
}

function table() {
  return Property.Dropdown<MssqlTable, true, typeof mssqlAuth>({
    auth: mssqlAuth,
    displayName: 'Table',
    description: 'The table to work with.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect to your database first',
          options: [],
        };
      }
      const pool = await mssqlCommon.connect({ auth });
      try {
        const tables = await mssqlCommon.getTables(pool);
        return {
          disabled: false,
          options: tables.map((entry) => ({
            label: `${entry.table_schema}.${entry.table_name}`,
            value: entry,
          })),
        };
      } finally {
        await pool.close();
      }
    },
  });
}

function column<R extends boolean>({
  displayName,
  description,
  required,
  sortableOnly = false,
}: {
  displayName: string;
  description: string;
  required: R;
  sortableOnly?: boolean;
}) {
  return Property.Dropdown<string, R, typeof mssqlAuth>({
    auth: mssqlAuth,
    displayName,
    description,
    required,
    refreshers: ['table'],
    options: async ({ auth, table: selected }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect to your database first',
          options: [],
        };
      }
      const target = asTable(selected);
      if (isNil(target)) {
        return {
          disabled: true,
          placeholder: 'Please select a table first',
          options: [],
        };
      }
      const pool = await mssqlCommon.connect({ auth });
      try {
        const meta = await mssqlCommon.getTableMeta({ pool, table: target });
        const columns = (
          sortableOnly
            ? meta.columns.filter((entry) =>
                cursorUtils.isOrderable({ meta, column: entry })
              )
            : meta.columns
        ).map((entry) => entry.name);
        return {
          disabled: false,
          options: columns.map((name) => ({
            label: name,
            value: name,
          })),
        };
      } finally {
        await pool.close();
      }
    },
  });
}

export const warningMarkdown = Property.MarkDown({
  value: `
  **DO NOT** paste dynamic values straight into the query text.
  \n
  Use **@name** placeholders in the query and put the values in the Parameters field, so they are sent separately and cannot cause **SQL injection**.`,
});

export const mssqlProps = {
  table,
  column,
};
