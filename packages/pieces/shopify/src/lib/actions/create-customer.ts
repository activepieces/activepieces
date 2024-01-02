import { Property, createAction } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient } from "@activepieces/pieces-common";
import { shopifyAuth } from "../..";
import { getBaseUrl, sendShopifyRequest } from "../common";

export const createCustomer = createAction({
    auth: shopifyAuth,
    name: 'create_customer',
    displayName: 'Create Customer',
    description: 'Create a new customer.',
    props: {

    },
    async run({ auth, propsValue }) {
        const { } = propsValue;

        const response = await sendShopifyRequest({
            auth: auth,
            url: '/customers.json',
            method: HttpMethod.GET,
            // body: {
            //     customer: {
            //         first_name: 'First',
            //         last_name: 'Last',
            //         email: 'example@activepieces.com'
            //     }
            // }
        })

        console.log(`${getBaseUrl(auth.shopName)}/customers.json`)
        return response.body;
    }
})
