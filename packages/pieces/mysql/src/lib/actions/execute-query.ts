import { createAction, Property } from "@activepieces/pieces-framework";
import { mysqlCommon, mysqlConnect } from "../common";

export default createAction({
    name: 'execute_query',
    displayName: 'Execute Query',
    description: 'Executes a query on the mysql database and returns the results',
    props: {
        authentication: mysqlCommon.authentication,
        timezone: mysqlCommon.timezone,
        query: Property.ShortText({
            displayName: 'Query',
            description: 'The query string to execute, use ? for arguments',
            required: true
        }),
        args: Property.Array({
            displayName: 'Arguments',
            description: 'Can inserted in the query string using ?',
            required: false
        })
    },
    async run(context) {
        const conn = await mysqlConnect(context.propsValue);
        try {
            const results = await conn.query(context.propsValue.query, context.propsValue.args || []);
            return Array.isArray(results) ? { results } : results
        } finally {
            await conn.end()
        }
    }
})