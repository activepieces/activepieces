import { createAction, Property } from "@activepieces/pieces-framework";
import { mysqlCommon, mysqlConnect } from "../common";

export default createAction({
    name: 'update_row',
    displayName: 'Update Row',
    description: 'Updates one or more rows in a table',
    props: {
        authentication: mysqlCommon.authentication,
        timezone: mysqlCommon.timezone,
        table: mysqlCommon.table(),
        values: Property.Object({
            displayName: 'Values',
            description: 'Values to be updated',
            required: true
        }),
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
        const fields = Object.keys(context.propsValue.values)
        const values = fields.map(f => context.propsValue.values[f])
        const qsValues = fields.map(f => "`" + f + "`=?").join(',')
        const qs = "UPDATE `" + context.propsValue.table + "` SET " + qsValues + " WHERE " + context.propsValue.condition + ";"
        const conn = await mysqlConnect(context.propsValue);
        try {
            const result = await conn.query(qs, [ ...values, ...(context.propsValue.args || []) ])
            return result
        } finally {
            await conn.end()
        }
    }
})