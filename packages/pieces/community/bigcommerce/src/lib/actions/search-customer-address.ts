
import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props"; // Import reusable props
import { BigCommerceClient, BigCommerceAddress } from "../common/client";

export const searchCustomerAddress = createAction({
    auth: bigcommerceAuth,
    name: 'search_customer_address',
    displayName: 'Search Customer Address',
    description: "Get a customer’s shipping address for order fulfillment.",

    props: {
        customer_id: bigcommerceProps.customerId(true),
    },

    async run(context) {
        const { customer_id } = context.propsValue;
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);

        const response = await client.makeRequest<{ data: BigCommerceAddress[] }>(
            HttpMethod.GET,
            `/v3/customers/${customer_id}/addresses`
        );

        return response.data;
    },
});