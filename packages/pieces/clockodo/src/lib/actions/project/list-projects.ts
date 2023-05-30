import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";
import { ProjectListFilter } from "../../common/models/project";

export default createAction({
    name: 'list_projects',
    displayName: 'Get Projects',
    description: 'Fetches projects from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id_filter: Property.Number({
            displayName: 'Customer ID Filter',
            description: 'Filter projects by their customer',
            required: false
        }),
        active_filter: Property.Checkbox({
            displayName: 'Active Filter',
            description: 'Filter customers by their active status',
            required: false,
            defaultValue: true
        }),
        page: Property.Number({
            displayName: 'Page',
            description: 'Reads only the specified page',
            required: false
        })
    },
    async run(context) {
        const client = makeClient(context);
        const filter: ProjectListFilter = {
            customers_id: context.propsValue.customer_id_filter,
            active: context.propsValue.active_filter
        }
        if(context.propsValue.page !== undefined) {
            const res = await client.listProjects({
                page: context.propsValue.page,
                filter
            })
            return {
                pagination: res.paging,
                projects: res.projects
            }
        } else {
            const projects = await client.listAllProjects(filter)
            return {
                projects
            }
        }
    }
})