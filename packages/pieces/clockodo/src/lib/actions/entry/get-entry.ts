import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_entry',
    displayName: 'Get Entry',
    description: 'Retrieves a single entry from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        entry_id: Property.Number({
            displayName: 'Entry ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.getEntry(context.propsValue.entry_id)
        return res.entry
    }
})