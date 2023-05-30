import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_absence',
    displayName: 'Delete Absence',
    description: 'Deletes an absence in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        absence_id: Property.Number({
            displayName: 'Absence ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        await client.deleteAbsence(context.propsValue.absence_id)
    }
})