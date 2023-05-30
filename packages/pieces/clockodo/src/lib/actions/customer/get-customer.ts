import { createAction, Property } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_customer',
    displayName: 'Get Customer',
    description: 'Retrieves a single customer from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id: Property.Number({
            displayName: 'Customer ID',
            required: true
        })
    },
    async run(context) {
        const client = makeClient(context);
        const res = await client.getCustomer(context.propsValue.customer_id)
        return res.customer
    }
})