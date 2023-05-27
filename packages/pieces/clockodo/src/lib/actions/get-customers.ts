import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../common";
import { Customer } from "../common/client";

export const getCustomersAction = createAction({
    name: 'get_customers',
    displayName: 'Get Customers',
    description: 'Fetches customers from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        active_filter: Property.Checkbox({
            displayName: 'Active Filter',
            description: 'Filter customers by their active status',
            required: false,
            defaultValue: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        let totalPages = 999999
        const customers: Customer[] = []
        for(let page=0; page < totalPages; page++) {
            const res = await client.listCustomers({
                page: page + 1,
                filter: {
                    active: context.propsValue.active_filter
                }
            })
            totalPages = res.paging.count_pages
            res.customers.forEach(c => customers.push(c))
        }
        return customers
    }
})