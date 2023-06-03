import { createAction, Property } from "@activepieces/pieces-framework";
import { mysqlCommon, mysqlConnect, mysqlGetTableNames } from "../common";

export default createAction({
    name: 'get_tables',
    displayName: 'Get Tables',
    description: 'Returns a list of tables in the database',
    props: {
        authentication: mysqlCommon.authentication
    },
    async run(context) {
        const conn = await mysqlConnect(context.propsValue)
        try {
            const tables = await mysqlGetTableNames(conn)
            return { tables }
        } finally {
            await conn.end()
        }
    }
})