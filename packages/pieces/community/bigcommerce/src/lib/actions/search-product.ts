

import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { BigCommerceClient, BigCommerceProduct } from "../common/client";

export const searchProduct = createAction({
    auth: bigcommerceAuth,
    name: 'search_product',
    displayName: 'Search Product',
    description: 'Searches for a product in the catalog by a specific field.',

    props: {
        search_by: Property.StaticDropdown({
            displayName: 'Search By',
            description: 'The field to search for the product by.',
            required: true,
            options: {
                options: [
                    { label: 'Name', value: 'name' },
                    { label: 'SKU', value: 'sku' },
                    { label: 'UPC', value: 'upc' },
                    { label: 'Product ID', value: 'id' },
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

        const response = await client.makeRequest<{ data: BigCommerceProduct[] }>(
            HttpMethod.GET,
            '/v3/catalog/products',
            undefined,
            query
        );

        if (response.data && response.data.length > 0) {
            return {
                found: true,
                product: response.data[0] 
            };
        } else {
            return {
                found: false,
                product: null
            };
        }
    },
});