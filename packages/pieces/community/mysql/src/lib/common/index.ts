import {
  AppConnectionValueForAuthProperty,
  MarkdownVariant,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { Connection, createConnection } from 'promise-mysql';
import { mysqlAuth } from '../..';
import sqlstring from 'sqlstring';

export const warningMarkdown = Property.MarkDown({
  value: 'Never type dynamic values into the SQL. Write ? instead and put the values in Arguments to prevent SQL injection.',
  variant: MarkdownVariant.WARNING,
});

export async function mysqlConnect(
  auth: AppConnectionValueForAuthProperty<typeof mysqlAuth>,
  propsValue: MysqlConnectOptions
): Promise<Connection> {
  const conn = await createConnection({
    host: auth.props.host,
    port: auth.props.port || 3306,
    user: auth.props.user,
    password: auth.props.password,
    database: auth.props.database || undefined,
    timezone: propsValue.timezone,
  });
  return conn;
}

export async function mysqlGetTableNames(conn: Connection): Promise<string[]> {
  const result = await conn.query('SHOW TABLES;');
  return result.map((row: Record<string, string>) => row[Object.keys(row)[0]]);
}

export async function mysqlGetColumns({ conn, table }: { conn: Connection; table: string }): Promise<MysqlColumn[]> {
  const rows: Record<string, unknown>[] = await conn.query(
    'SELECT column_name AS column_name, data_type AS data_type, is_nullable AS is_nullable, column_default AS column_default, extra AS extra FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ordinal_position',
    [table]
  );
  return rows.map((row) => ({
    column_name: String(row['column_name']),
    data_type: String(row['data_type']),
    is_nullable: String(row['is_nullable']),
    column_default: row['column_default'] === null ? null : String(row['column_default']),
    extra: String(row['extra']),
  }));
}

export const mysqlCommon = {
  timezone: Property.ShortText({
    displayName: 'Timezone',
    description: 'Timezone of dates on the server: Z for UTC, or an offset like +02:00.',
    placeholder: '+02:00',
    required: false,
    advanced: true,
  }),
  table: (required = true) =>
    Property.Dropdown({
      auth: mysqlAuth,
      displayName: 'Table',
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
        const { data: tables, error } = await tryCatch(() => listTableNames({ auth }));
        if (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Could not load tables. Check the connection and its Database.',
          };
        }
        if (tables.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No tables found in this database.',
          };
        }
        return {
          disabled: false,
          options: tables.map((table) => {
            return {
              label: table,
              value: table,
            };
          }),
        };
      },
    }),
};


export function sanitizeColumnName(name: string | undefined): string {
  if ( name == '*') {
    return name;
  }
  return sqlstring.escapeId(name);
}

async function listTableNames({ auth }: { auth: AppConnectionValueForAuthProperty<typeof mysqlAuth> }): Promise<string[]> {
  const conn = await mysqlConnect(auth, {});
  try {
    return await mysqlGetTableNames(conn);
  } finally {
    await conn.end();
  }
}

export type MysqlConnectOptions = {
  timezone?: string;
};

export type MysqlColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  extra: string;
};
