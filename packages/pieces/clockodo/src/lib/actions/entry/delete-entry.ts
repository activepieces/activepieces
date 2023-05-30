import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_entry',
    displayName: 'Delete Entry',
    description: 'Deletes an entry in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        entry_id: Property.Number({
            displayName: 'Entry ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        await client.deleteEntry(context.propsValue.entry_id)
    }
})