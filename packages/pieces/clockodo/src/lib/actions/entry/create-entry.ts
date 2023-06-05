import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient, reformatDateTime } from "../../common";
import { TimeRecordEntry } from "../../common/models/entry";

export default createAction({
    name: 'create_entry',
    displayName: 'Create Entry',
    description: 'Creates an entry in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id: clockodoCommon.customer_id(),
        project_id: clockodoCommon.project_id(false),
        service_id: clockodoCommon.service_id(),
        time_since: Property.DateTime({
            displayName: 'Start Time',
            required: true
        }),
        time_until: Property.DateTime({
            displayName: 'End Time',
            required: true
        }),
        text: Property.LongText({
            displayName: 'Description',
            required: false
        }),
        hourly_rate: Property.Number({
            displayName: 'Hourly Rate',
            required: false
        }),
        user_id: clockodoCommon.user_id(false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.createEntry({
            customers_id: context.propsValue.customer_id,
            projects_id: context.propsValue.project_id,
            services_id: context.propsValue.service_id,
            time_since: reformatDateTime(context.propsValue.time_since),
            time_until: reformatDateTime(context.propsValue.time_until),
            text: context.propsValue.text,
            hourly_rate: context.propsValue.hourly_rate,
            users_id: context.propsValue.user_id
        } as TimeRecordEntry) // For now we only support time records
        return res.entry
    }
})