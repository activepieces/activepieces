import { Property, createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'list_absences',
    displayName: 'Get Absences',
    description: 'Fetches absences from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        year: Property.Number({
            displayName: 'Year',
            required: true
        }),
        user_id: clockodoCommon.user_id(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.listAbsences({
            year: context.propsValue.year,
            users_id: context.propsValue.user_id
        })
        return {
            absences: res.absences
        }
    }
})