import { createAction, Property } from "@activepieces/pieces-framework";
import { mysqlCommon, mysqlConnect } from "../common";

export default createAction({
    name: 'delete_row',
    displayName: 'Delete Row',
    description: 'Deletes one or more rows from a table',
    props: {
        authentication: mysqlCommon.authentication,
        timezone: mysqlCommon.timezone,
        table: mysqlCommon.table(),
        condition: Property.ShortText({
            displayName: 'Condition',
            required: true
        }),
        args: Property.Array({
            displayName: 'Args',
            description: 'Arguments can be used using ? in the condition',
            required: false
        })
    },
    async run(context) {
        const qs = "DELETE FROM `" + context.propsValue.table + "` WHERE " + context.propsValue.condition + ";"
        const conn = await mysqlConnect(context.propsValue);
        try {
            const result = await conn.query(qs, context.propsValue.args)
            await conn.end()
            return result
        } catch(e) {
            await conn.end()
            throw e
        }
    }
})