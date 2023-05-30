import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_customer',
    displayName: 'Delete Customer',
    description: 'Deletes a customer in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id: Property.Number({
            displayName: 'Customer ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        await client.deleteCustomer(context.propsValue.customer_id)
    }
})