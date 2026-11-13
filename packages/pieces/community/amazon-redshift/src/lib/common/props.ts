import { DropdownState, InputPropertyMap, PropertyContext, Property } from '@activepieces/pieces-framework';
import { redshiftAuth } from '../auth';
import { redshiftClient } from './client';
import type { RedshiftAuthValue, RedshiftColumn, RedshiftTable } from './types';

function table<R extends boolean>({ required, displayName = 'Table', description = 'The table to use.' }: PropParams<R>) {
  return Property.Dropdown<RedshiftTable, R, typeof redshiftAuth>({
    auth: redshiftAuth,
    displayName,
    description,
    required,
    refreshers: [],
    options: async ({ auth }, { server }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      const { rows } = await redshiftClient.runSql({
        auth,
        server,
        sql: `SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_internal') ORDER BY table_schema, table_name`,
      });
      const tables = rows.map((row) => ({ table_schema: String(row['table_schema']), table_name: String(row['table_name']) }));
      return {
        disabled: false,
        options: tables.map((item) => ({ label: `${item.table_schema}.${item.table_name}`, value: item })),
        placeholder: tables.length === 0 ? 'No tables found.' : undefined,
      };
    },
  });
}

function column<R extends boolean>({ required, displayName = 'Column', description }: PropParams<R>) {
  return Property.Dropdown<string, R, typeof redshiftAuth>({
    auth: redshiftAuth,
    displayName,
    description,
    required,
    refreshers: ['table'],
    options: async ({ auth, table }, { server }) => {
      if (!auth) {
        return disabledOptions({ placeholder: 'Please connect your account first.' });
      }
      if (!isTable(table)) {
        return disabledOptions({ placeholder: 'Please select a table first.' });
      }
      const columns = await listColumns({ auth, server, table });
      return { disabled: false, options: columns.map((item) => ({ label: `${item.column_name} (${item.data_type})`, value: item.column_name })) };
    },
  });
}

function rows<R extends boolean>({ required, displayName = 'Rows', description }: PropParams<R>) {
  return Property.DynamicProperties({
    auth: redshiftAuth,
    displayName,
    description,
    required,
    refreshers: ['table'],
    props: async ({ auth, table }, { server }): Promise<InputPropertyMap> => {
      if (!auth || !isTable(table)) {
        return {};
      }
      const columns = await listColumns({ auth, server, table });
      return {
        rows: Property.Array({
          displayName: 'Rows',
          description: 'One item per row. Leave a field empty to use the column default.',
          required: true,
          properties: Object.fromEntries(
            columns.map((item) => [
              item.column_name,
              Property.ShortText({ displayName: item.column_name, description: describeColumn({ column: item }), required: isRequiredColumn({ column: item }) }),
            ]),
          ),
        }),
      };
    },
  });
}

function values<R extends boolean>({ required, displayName = 'New Values', description = 'Only the fields you fill are changed.' }: PropParams<R>) {
  return Property.DynamicProperties({
    auth: redshiftAuth,
    displayName,
    description,
    required,
    refreshers: ['table'],
    props: async ({ auth, table }, { server }): Promise<InputPropertyMap> => {
      if (!auth || !isTable(table)) {
        return {};
      }
      const columns = await listColumns({ auth, server, table });
      return Object.fromEntries(
        columns.map((item) => [item.column_name, Property.ShortText({ displayName: item.column_name, description: item.data_type, required: false })]),
      );
    },
  });
}

async function listColumns({ auth, server, table }: { auth: RedshiftAuthValue; server: PropertyContext['server']; table: RedshiftTable }): Promise<RedshiftColumn[]> {
  const { rows: columns } = await redshiftClient.runSql({
    auth,
    server,
    sql: 'SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position',
    params: [table.table_schema, table.table_name],
  });
  return columns.map((row) => ({
    column_name: String(row['column_name']),
    data_type: String(row['data_type']),
    is_nullable: String(row['is_nullable']),
    column_default: row['column_default'] === null || row['column_default'] === undefined ? null : String(row['column_default']),
  }));
}

function isTable(value: unknown): value is RedshiftTable {
  return typeof value === 'object' && value !== null && 'table_schema' in value && 'table_name' in value && typeof value.table_schema === 'string' && typeof value.table_name === 'string';
}

function isRequiredColumn({ column }: { column: RedshiftColumn }): boolean {
  return column.is_nullable === 'NO' && column.column_default === null;
}

function describeColumn({ column }: { column: RedshiftColumn }): string {
  return isRequiredColumn({ column }) ? `${column.data_type} · required` : column.data_type;
}

function disabledOptions({ placeholder }: { placeholder: string }): DropdownState<never> {
  return { disabled: true, options: [], placeholder };
}

export const redshiftProps = { table, column, rows, values };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
