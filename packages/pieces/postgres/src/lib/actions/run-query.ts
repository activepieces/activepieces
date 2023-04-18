import { createAction, Property } from "@activepieces/pieces-framework";
import pg from 'pg';

export const runQuery = createAction({
    name: 'run-query',
    displayName: "Run Query",
    description: "Run Query",
    props: {
        host: Property.SecretText({
            displayName: 'Host',
            required: true,
        }),
        port: Property.Number({
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
        }),
        query: Property.ShortText({
            displayName: 'Query',
            required: true,
        }),
        rejectUnauthorized: Property.Checkbox({
            displayName: 'Reject Unauthorized',
            required: true,
            defaultValue: true
        })
    },
    async run(context) {
        const { host, user, database, password, port, query, rejectUnauthorized } = context.propsValue;

        const client = new pg.Client({
            host,
            port,
            user,
            password,
            database,
            ssl: { rejectUnauthorized },
        })
        await client.connect();

        return new Promise((resolve) => {
            client.query(query, function (error, results) {
                resolve(results.rows);
                client.end();
            });
        })

    },
});