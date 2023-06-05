import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient, reformatDateTime } from "../../common";

export default createAction({
    name: 'update_entry',
    displayName: 'Update Entry',
    description: 'Updates an entry in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        entry_id: Property.Number({
            displayName: 'Entry ID',
            required: true
        }),
        customer_id: clockodoCommon.customer_id(false),
        project_id: clockodoCommon.project_id(false),
        service_id: clockodoCommon.service_id(false),
        time_since: Property.DateTime({
            displayName: 'Start Time',
            required: false
        }),
        time_until: Property.DateTime({
            displayName: 'End Time',
            required: false
        }),
        text: Property.LongText({
            displayName: 'Description',
            required: false
        }),
        user_id: clockodoCommon.user_id(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.updateEntry(context.propsValue.entry_id, {
            customers_id: context.propsValue.customer_id,
            projects_id: context.propsValue.project_id,
            services_id: context.propsValue.service_id,
            users_id: context.propsValue.user_id,
            text: context.propsValue.text,
            time_since: reformatDateTime(context.propsValue.time_since),
            time_until: reformatDateTime(context.propsValue.time_until)
        })
        return res.entry
    }
})