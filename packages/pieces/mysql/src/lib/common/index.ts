import { Property, StaticPropsValue } from "@activepieces/pieces-framework";
import { Connection, createConnection } from 'promise-mysql';

export async function mysqlConnect(propsValue: StaticPropsValue<any>): Promise<Connection> {
    const conn = await createConnection({
        host: propsValue.authentication.host,
        port: propsValue.authentication.port || 3306,
        user: propsValue.authentication.user,
        password: propsValue.authentication.password,
        database: propsValue.authentication.database || undefined,
        timezone: propsValue.timezone
    })
    return conn
}

export async function mysqlGetTableNames(conn: Connection): Promise<string[]> {
    const result = await conn.query('SHOW TABLES;')
    return result.map((row: Record<string, string>) => row[Object.keys(row)[0]])
}

export const mysqlCommon = {
    authentication: Property.CustomAuth({
        displayName: "Authentication",
            props: {
                host: Property.ShortText({
                    displayName: 'Host',
                    required: true,
                    description: "The hostname or address of the mysql server"
                }),
                port: Property.ShortText({
                    displayName: 'Port',
                    defaultValue: '3306',
                    description: "The port to use for connecting to the mysql server",
                    required: true,
                }),
                user: Property.ShortText({
                    displayName: 'User',
                    required: true,
                    description: "The username to use for connecting to the mysql server"
                }),
                password: Property.SecretText({
                    displayName: 'Password',
                    description: "The password to use to identify at the mysql server",
                    required: true,
                }),
                database: Property.ShortText({
                    displayName: 'Database',
                    description: "The name of the database to use",
                    required: true,
                })
            },
            required: true
    }),
    timezone: Property.ShortText({
        displayName: 'Timezone',
        description: 'Timezone for the mysql server to use',
        required: false
    }),
    table: (required = true) => Property.Dropdown({
        description: 'The name of the table',
        displayName: 'Table',
        required,
        refreshers: ['authentication'],
        options: async (value) => {
            if (!value['authentication']) {
                return {
                    disabled: true,
                    placeholder: 'connect to your database first',
                    options: [],
                };
            }
            const conn = await mysqlConnect(value)
            const tables = await mysqlGetTableNames(conn)
            await conn.end()
            return {
                disabled: false,
                options: tables.map((table) => {
                    return {
                        label: table,
                        value: table
                    }
                }),
            };
        }
    })
}

export function isSpecialColumn(name: string): boolean {
    return name == '*' ||
        name.includes(' ') ||
        name.includes('(');
}