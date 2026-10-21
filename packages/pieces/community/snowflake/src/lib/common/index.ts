import {
  DropdownState,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { snowflakeAuth } from '../auth';
import { SnowflakeAuthValue, withSnowflake } from './client';
import { qualifiedName } from './sql';

export * from './client';

export function toAuthValue(auth: unknown): SnowflakeAuthValue {
  if (isSnowflakeAuthValue(auth)) {
    return auth;
  }
  throw new Error('Connect a Snowflake account to this step first.');
}

function isSnowflakeAuthValue(auth: unknown): auth is SnowflakeAuthValue {
  if (typeof auth !== 'object' || auth === null) return false;
  if (!('type' in auth) || !('props' in auth)) return false;
  const props = auth.props;
  return (
    typeof props === 'object' &&
    props !== null &&
    'account' in props &&
    typeof props.account === 'string'
  );
}

async function loadDropdown({
  auth,
  sql,
  toOption,
}: {
  auth: unknown;
  sql: string;
  toOption: (row: Record<string, unknown>) => { label: string; value: string };
}): Promise<DropdownState<string>> {
  try {
    const result = await withSnowflake({
      auth: toAuthValue(auth),
      statementTimeoutSeconds: 60,
      fn: (session) => session.query({ sql, maxRows: 5000 }),
    });
    return { disabled: false, options: result.rows.map(toOption) };
  } catch (error) {
    return {
      disabled: true,
      options: [],
      placeholder: `Could not load options: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }
}

function nameOption(row: Record<string, unknown>) {
  const name = String(row['name'] ?? '');
  return { label: name, value: name };
}

export async function getTableColumnOptions({
  auth,
  table,
}: {
  auth: SnowflakeAuthValue;
  table: string;
}): Promise<DropdownState<string>> {
  return loadDropdown({
    auth,
    sql: `DESCRIBE TABLE ${qualifiedName({ value: table, label: 'Table' })}`,
    toOption: nameOption,
  });
}

async function describeColumns({
  auth,
  table,
}: {
  auth: unknown;
  table: unknown;
}): Promise<DynamicPropsValue> {
  if (!auth || typeof table !== 'string' || table === '') return {};
  const result = await withSnowflake({
    auth: toAuthValue(auth),
    statementTimeoutSeconds: 60,
    fn: (session) =>
      session.query({
        sql: `DESCRIBE TABLE ${qualifiedName({
          value: table,
          label: 'Table',
        })}`,
      }),
  });
  const fields: DynamicPropsValue = {};
  for (const column of result.rows) {
    const name = String(column['name'] ?? '');
    if (name === '') continue;
    fields[name] = Property.ShortText({ displayName: name, required: false });
  }
  return fields;
}

const notConnected = {
  disabled: true,
  options: [],
  placeholder: 'Please connect your account first',
};

export const snowflakeCommonProps = {
  database: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Database',
    description:
      'Select the Snowflake database to use. Databases are listed under **Data → Databases** in the Snowflake console.',
    refreshers: [],
    required: true,
    options: async ({ auth }) => {
      if (!auth) return notConnected;
      return loadDropdown({
        auth,
        sql: 'SHOW DATABASES',
        toOption: nameOption,
      });
    },
  }),
  schema: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Schema',
    description:
      'Select the schema within the chosen database. Schemas are listed under **Data → Databases → [your database]** in the Snowflake console.',
    refreshers: ['database'],
    required: true,
    options: async ({ auth, database }) => {
      if (!auth) return notConnected;
      if (!database) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a database first',
        };
      }
      return loadDropdown({
        auth,
        sql: `SHOW SCHEMAS IN DATABASE ${qualifiedName({
          value: String(database),
          maxParts: 1,
          label: 'Database',
        })}`,
        toOption: nameOption,
      });
    },
  }),
  table: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Table',
    description: 'Select the table to work with.',
    refreshers: ['database', 'schema'],
    required: true,
    options: async ({ auth, database, schema }) => {
      if (!auth) return notConnected;
      if (!database) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a database first',
        };
      }
      if (!schema) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please select a schema first',
        };
      }
      return loadDropdown({
        auth,
        sql: `SHOW TABLES IN SCHEMA ${qualifiedName({
          value: `${database}.${schema}`,
          maxParts: 2,
          label: 'Schema',
        })}`,
        toOption: (row) => {
          const name = String(row['name'] ?? '');
          return { label: name, value: `${database}.${schema}.${name}` };
        },
      });
    },
  }),
  warehouse: Property.Dropdown({
    auth: snowflakeAuth,
    displayName: 'Warehouse',
    description:
      'Select the virtual warehouse to use for this operation. Warehouses are listed under **Admin → Warehouses** in the Snowflake console. Leave empty to use the warehouse set in your connection.',
    refreshers: [],
    required: false,
    options: async ({ auth }) => {
      if (!auth) return notConnected;
      return loadDropdown({
        auth,
        sql: 'SHOW WAREHOUSES',
        toOption: nameOption,
      });
    },
  }),
  table_column_values: Property.DynamicProperties({
    auth: snowflakeAuth,
    displayName: 'Row Data',
    description: 'Enter the value for each column in the new row.',
    required: true,
    refreshers: ['database', 'schema', 'table'],
    props: async ({ auth, table }) => describeColumns({ auth, table }),
  }),
  table_update_values: Property.DynamicProperties({
    auth: snowflakeAuth,
    displayName: 'Columns to Update',
    description:
      'Only filled columns will be updated. Leave a column empty to keep its existing value.',
    required: true,
    refreshers: ['database', 'schema', 'table'],
    props: async ({ auth, table }) => describeColumns({ auth, table }),
  }),
};
