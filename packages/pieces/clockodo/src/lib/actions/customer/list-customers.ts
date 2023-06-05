import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";
import { CustomerListFilter } from "../../common/models/customer";

export default createAction({
    name: 'list_customers',
    displayName: 'Get Customers',
    description: 'Fetches customers from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
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
        const client = makeClient(context.propsValue);
        const filter: CustomerListFilter = {
            active: context.propsValue.active_filter
        }
        if(context.propsValue.page !== undefined) {
            const res = await client.listCustomers({
                page: context.propsValue.page,
                filter
            })
            return {
                pagination: res.paging,
                customers: res.customers
            }
        } else {
            const customers = await client.listAllCustomers(filter)
            return {
                customers
            }
        }
    }
})