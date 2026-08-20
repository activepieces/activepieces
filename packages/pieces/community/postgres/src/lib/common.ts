import { AppConnectionValueForAuthProperty, Property } from "@activepieces/pieces-framework";
import { postgresAuth } from "..";
import { Client } from "pg";
import format from "pg-format";

export const pgClient = async (auth: AppConnectionValueForAuthProperty<typeof postgresAuth>, query_timeout = 30000, application_name: string | undefined = undefined , connectionTimeoutMillis = 30000) => {
    const {
        host,
        user,
        database,
        password,
        port,
        enable_ssl,
        reject_unauthorized: rejectUnauthorized,
        certificate,
    } = auth.props;

    const sslConf = {
        rejectUnauthorized: rejectUnauthorized,
        ca: certificate && certificate.length > 0 ? certificate : undefined,
    };
    const client = new Client({
        host,
        port: Number(port),
        user,
        password,
        database,
        ssl: enable_ssl ? sslConf : undefined,
        query_timeout: Number(query_timeout),
        statement_timeout: Number(query_timeout),
        application_name,
        connectionTimeoutMillis: Number(connectionTimeoutMillis),
    });
    await client.connect();

    return client;
}

const listTables = async (client: Client): Promise<PostgresTable[]> => {
    const result = await client.query<PostgresTable>(
        `SELECT table_schema, table_name FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema NOT IN ('pg_catalog', 'information_schema') ORDER BY table_schema, table_name`
    );
    return result.rows;
}

const listColumns = async ({ client, table }: { client: Client, table: PostgresTable }): Promise<string[]> => {
    const result = await client.query<{ column_name: string }>(
        `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 ORDER BY ordinal_position`,
        [table.table_schema, table.table_name]
    );
    return result.rows.map((row) => row.column_name);
}

const isPostgresTable = (value: unknown): value is PostgresTable => {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    const candidate: Record<string, unknown> = { ...value };
    return typeof candidate['table_schema'] === 'string' && typeof candidate['table_name'] === 'string';
}

const qualifiedName = (table: PostgresTable): string => format('%I.%I', table.table_schema, table.table_name);

const quoteIdentifier = (name: string): string => name === '*' ? name : format.ident(name);

export const warningMarkdown = Property.MarkDown({
    value: `
    **DO NOT** insert dynamic input directly into the condition. Use **$1**, **$2**, etc. in the condition and pass the values in Arguments for parameterized queries to prevent **SQL injection.**`,
});

export const postgresCommon = {
    table: Property.Dropdown<PostgresTable, true, typeof postgresAuth>({
        auth: postgresAuth,
        displayName: 'Table',
        required: true,
        refreshers: [],
        refreshOnSearch: false,
        options: async ({ auth }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first',
                };
            }
            const client = await pgClient(auth);
            try {
                const tables = await listTables(client);
                return {
                    disabled: false,
                    options: tables.map((table) => ({
                        label: `${table.table_schema}.${table.table_name}`,
                        value: {
                            table_schema: table.table_schema,
                            table_name: table.table_name,
                        },
                    })),
                };
            } finally {
                await client.end();
            }
        },
    }),
    column: ({ displayName, description }: { displayName: string, description?: string }) =>
        Property.Dropdown<string, true, typeof postgresAuth>({
            auth: postgresAuth,
            displayName,
            description,
            required: true,
            refreshers: ['table'],
            refreshOnSearch: false,
            options: async ({ auth, table }) => {
                if (!auth) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please authenticate first',
                    };
                }
                if (!isPostgresTable(table)) {
                    return {
                        disabled: true,
                        options: [],
                        placeholder: 'Please select a table',
                    };
                }
                const client = await pgClient(auth);
                try {
                    const columns = await listColumns({ client, table });
                    return {
                        disabled: false,
                        options: columns.map((column) => ({
                            label: column,
                            value: column,
                        })),
                    };
                } finally {
                    await client.end();
                }
            },
        }),
    columns: Property.MultiSelectDropdown<string, false, typeof postgresAuth>({
        auth: postgresAuth,
        displayName: 'Columns',
        description: 'The columns to return. Leave empty to return every column.',
        required: false,
        refreshers: ['table'],
        options: async ({ auth, table }) => {
            if (!auth) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please authenticate first',
                };
            }
            if (!isPostgresTable(table)) {
                return {
                    disabled: true,
                    options: [],
                    placeholder: 'Please select a table',
                };
            }
            const client = await pgClient(auth);
            try {
                const columns = await listColumns({ client, table });
                return {
                    disabled: false,
                    options: columns.map((column) => ({
                        label: column,
                        value: column,
                    })),
                };
            } finally {
                await client.end();
            }
        },
    }),
};

export const postgresUtils = {
    listTables,
    listColumns,
    isPostgresTable,
    qualifiedName,
    quoteIdentifier,
};

export type PostgresTable = {
    table_schema: string;
    table_name: string;
};
