import {
  AppConnectionValueForAuthProperty,
  PiecePropValueSchema,
  Property,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { Connection, createConnection } from 'promise-mysql';
import { mysqlAuth } from '../..';
import sqlstring from 'sqlstring';

export const warningMarkdown = Property.MarkDown({
  value: `
  **DO NOT** use dynamic input directly in the query string or column names.
  \n
  Use **?** in the query and dynamic values in args/values for parameterized queries to prevent **SQL injection**.`
});

export async function mysqlConnect(
  auth: AppConnectionValueForAuthProperty<typeof mysqlAuth>,
  propsValue: StaticPropsValue<any>
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

export const mysqlCommon = {
  timezone: Property.ShortText({
    displayName: 'Timezone',
    description: 'Timezone for the MySQL server to use',
    required: false,
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
        const conn = await mysqlConnect(
          auth,
          { auth }
        );
        const tables = await mysqlGetTableNames(conn);
        await conn.end();
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
