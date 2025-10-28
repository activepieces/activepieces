
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient, BigCommerceCustomer } from "../common/client";

export const searchCustomer = createAction({
    auth: bigcommerceAuth,
    name: 'search_customer',
    displayName: 'Search Customer',
    description: 'Searches for a registered customer by a specific field.',

    props: {
        search_by: Property.StaticDropdown({
            displayName: 'Search By',
            description: 'The field to search for the customer by.',
            required: true,
            options: {
                options: [
                    { label: 'Email', value: 'email' },
                    { label: 'Company', value: 'company' },
                    { label: 'Phone', value: 'phone' },
                ]
            }
        }),
        search_value: Property.ShortText({
            displayName: 'Search Value',
            description: 'The value to search for.',
            required: true,
        })
    },

    async run(context) {
        const { search_by, search_value } = context.propsValue;
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);

        const query: QueryParams = {};
        query[search_by] = search_value;
        query['limit'] = '1'; 


        const response = await client.makeRequest<{ data: BigCommerceCustomer[] }>(
            HttpMethod.GET,
            '/v3/customers',
            undefined,
            query
        );

        if (response.data && response.data.length > 0) {
            return {
                found: true,
                customer: response.data[0] 
            };
        } else {
            return {
                found: false,
                customer: null
            };
        }
    },
});