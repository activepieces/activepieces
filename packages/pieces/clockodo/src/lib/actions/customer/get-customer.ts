import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'get_customer',
    displayName: 'Get Customer',
    description: 'Retrieves a single customer from clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id: clockodoCommon.customer_id(true, undefined)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        const res = await client.getCustomer(context.propsValue.customer_id as number)
        return res.customer
    }
})