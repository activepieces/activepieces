import { createAction, Property } from "@activepieces/pieces-framework";
import pg from 'pg';

export const runQuery = createAction({
    name: 'run-query',
    displayName: "Run Query",
    description: "Run Query",
    props: {
        authentication: Property.CustomAuth({
            displayName: "Authentication",
            props: {
                host: Property.ShortText({
                    displayName: 'Host',
                    required: true,
                }),
                port: Property.ShortText({
                    displayName: 'Port',
                    required: true,
                }),
                user: Property.ShortText({
                    displayName: 'User',
                    required: true,
                }),
                password: Property.SecretText({
                    displayName: 'Password',
                    required: true,
                }),
                database: Property.ShortText({
                    displayName: 'Database',
                    required: true,
                })
            },
            required: true
        }),
        query: Property.ShortText({
            displayName: 'Query',
            required: true,
        }),
        rejectUnauthorized: Property.Checkbox({
            displayName: 'Reject Unauthorized',
            required: true,
            defaultValue: true
        }),
        keepAlive: Property.Checkbox({
            displayName: 'Reject Unauthorized',
            required: false,
        }),
        query_timeout: Property.Number({
            displayName: 'Query Timeout',
            required: false,
        }),
        statement_timeout: Property.Number({
            displayName: 'Statement Timeout',
            required: false,
        }),
        connectionTimeoutMillis: Property.Number({
            displayName: 'Connection Timeout (ms)',
            required: false,
        }),
        application_name: Property.ShortText({
            displayName: 'Application Name',
            required: false,
        }),
    },
    async run(context) {
        const { host, user, database, password, port } = context.propsValue.authentication;
        const { query, rejectUnauthorized, keepAlive, query_timeout, statement_timeout, application_name, connectionTimeoutMillis } = context.propsValue;

        const client = new pg.Client({
            host,
            port: Number(port),
            user,
            password,
            database,
            ssl: { rejectUnauthorized },
            keepAlive,
            query_timeout,
            statement_timeout,
            application_name,
            connectionTimeoutMillis,
        })
        await client.connect();

        return new Promise((resolve, reject) => {
            client.query(query, function (error, results) {
                if (error) {
                    client.end();
                    return reject(error);
                }
                resolve(results.rows);
                client.end();
            });
        })
    },
});