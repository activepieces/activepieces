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
        customer_id: Property.Number({
            displayName: 'Customer ID',
            required: false
        }),
        project_id: Property.Number({
            displayName: 'Project ID',
            required: false
        }),
        service_id: Property.Number({
            displayName: 'Service ID',
            required: false
        }),
        time_since: Property.DateTime({
            displayName: 'Start Time',
            required: false
        }),
        time_until: Property.DateTime({
            displayName: 'End Time',
            required: false
        }),
        text: Property.ShortText({
            displayName: 'Description',
            required: false
        }),
        user_id: Property.Number({
            displayName: 'User ID',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context);
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