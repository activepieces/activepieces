
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props"; 
import { BigCommerceClient } from "../common/client";

export const createProduct = createAction({
    auth: bigcommerceAuth,
    name: 'create_product',
    displayName: 'Create a Product',
    description: 'Creates a new product in your BigCommerce catalog.',

    props: {
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the product.',
            required: true,
        }),
        type: Property.StaticDropdown({
            displayName: 'Type',
            description: 'The type of product.',
            required: true,
            options: {
                options: [
                    { label: 'Physical', value: 'physical' },
                    { label: 'Digital', value: 'digital' },
                ],
            },
        }),
        price: Property.Number({
            displayName: 'Price',
            description: 'The price of the product.',
            required: true,
        }),
        weight: Property.Number({
            displayName: 'Weight',
            description: 'The weight of the product. Required for physical products.',
            required: true,
        }),
        sku: Property.ShortText({
            displayName: 'SKU',
            description: 'The unique stock-keeping unit.',
            required: false,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A detailed description of the product.',
            required: false,
        }),
        categories: bigcommerceProps.product_categories(false)
    },

    async run(context) {
        const { name, type, price, weight, sku, description, categories } = context.propsValue;
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);
        
        const productBody: Record<string, unknown> = {
            name,
            type,
            price,
            weight,
        };

        if (sku) productBody['sku'] = sku;
        if (description) productBody['description'] = description;
        if (categories && (categories as unknown[]).length > 0) {
            productBody['categories'] = (categories as number[]).map(id => Number(id));
        }
        
        const response = await client.makeRequest(
            HttpMethod.POST,
            '/v3/catalog/products',
            productBody
        );
        
        return response;
    },
});