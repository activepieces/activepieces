import { createAction } from "@activepieces/pieces-framework";
import { clockodoCommon, makeClient } from "../../common";

export default createAction({
    name: 'delete_customer',
    displayName: 'Delete Customer',
    description: 'Deletes a customer in clockodo',
    props: {
        authentication: clockodoCommon.authentication,
        customer_id: clockodoCommon.customer_id(true, false)
    },
    async run(context) {
        const client = makeClient(context.propsValue);
        await client.deleteCustomer(context.propsValue.customer_id as number)
    }
})