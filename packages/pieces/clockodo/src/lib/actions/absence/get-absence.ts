import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_absence',
    displayName: 'Get Absence',
    description: 'Retrieves a single absence from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        absence_id: Property.Number({
            displayName: 'Absence ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.getAbsence(context.propsValue.absence_id)
        return res.absence
    }
})