import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient, reformatDateTime } from "../../common";
import { ProjectListFilter } from "../../common/models/project";
import { EntryListFilter } from "../../common/models/entry";

export default createAction({
    name: 'list_entries',
    displayName: 'Get Entries',
    description: 'Fetches entries from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        time_since: Property.DateTime({
            displayName: 'Start Date',
            required: true
        }),
        time_until: Property.DateTime({
            displayName: 'End Date',
            required: true
        }),
        user_id_filter: Property.Number({
            displayName: 'Customer ID Filter',
            description: 'Filter entries by their user',
            required: false
        }),
        customer_id_filter: Property.Number({
            displayName: 'Customer ID Filter',
            description: 'Filter entries by their customer',
            required: false
        }),
        project_id_filter: Property.Number({
            displayName: 'Project ID Filter',
            description: 'Filter entries by their project',
            required: false
        }),
        service_id_filter: Property.Number({
            displayName: 'Service ID Filter',
            description: 'Filter entries by their service',
            required: false
        }),
        enhanced_list: Property.Checkbox({
            displayName: 'Enhanced List',
            description: 'Retrieves additional information about the entries',
            required: false
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Reads only the specified page',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context);
        const filter: EntryListFilter = {
            users_id: context.propsValue.user_id_filter,
            customers_id: context.propsValue.customer_id_filter,
            projects_id: context.propsValue.project_id_filter,
            services_id: context.propsValue.service_id_filter
        }
        const time_since = reformatDateTime(context.propsValue.time_since) as string
        const time_until = reformatDateTime(context.propsValue.time_until) as string
        if(context.propsValue.page !== undefined) {
            const res = await client.listEntries({
                time_since,
                time_until,
                enhanced_list: context.propsValue.enhanced_list,
                page: context.propsValue.page,
                filter
            })
            return {
                pagination: res.paging,
                entries: res.entries
            }
        } else {
            const entries = await client.listAllEntries(time_since, time_until, filter)
            return {
                entries
            }
        }
    }
})