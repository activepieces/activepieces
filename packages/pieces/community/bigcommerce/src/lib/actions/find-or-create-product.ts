
import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, QueryParams } from "@activepieces/pieces-common";
import { bigcommerceAuth, BigCommerceAuth } from "../common/auth";
import { bigcommerceProps } from "../common/props"; 
import { BigCommerceClient, BigCommerceProduct } from "../common/client";

export const findOrCreateProduct = createAction({
    auth: bigcommerceAuth,
    name: 'find_or_create_product',
    displayName: 'Find or Create Product',
    description: 'Finds a product by SKU. If not found, a new one will be created.',

    props: {
        sku: Property.ShortText({
            displayName: 'SKU',
            description: 'The unique stock-keeping unit. Used to find or create.',
            required: true,
        }),
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The name of the product (used if creating).',
            required: true,
        }),
        type: Property.StaticDropdown({
            displayName: 'Type',
            description: 'The type of product (used if creating).',
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
            description: 'The price of the product (used if creating).',
            required: true,
        }),
        weight: Property.Number({
            displayName: 'Weight',
            description: 'The weight of the product. Required for physical products (used if creating).',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'A detailed description of the product (used if creating).',
            required: false,
        }),
        categories: bigcommerceProps.product_categories(false)
    },

    async run(context) {
        const { sku, name, type, price, weight, description, categories } = context.propsValue;
        const client = new BigCommerceClient(context.auth as BigCommerceAuth);

        const query: QueryParams = {
            sku: sku as string,
            limit: '1'
        };

        const findResponse = await client.makeRequest<{ data: BigCommerceProduct[] }>(
            HttpMethod.GET,
            '/v3/catalog/products',
            undefined,
            query
        );

        if (findResponse.data && findResponse.data.length > 0) {
            return {
                status: "found",
                product: findResponse.data[0]
            };
        }

        const createBody: Record<string, unknown> = {
            sku,
            name,
            type,
            price,
            weight,
        };

        if (description) createBody['description'] = description;
        if (categories && (categories as unknown[]).length > 0) {
            createBody['categories'] = (categories as number[]).map(id => Number(id));
        }

        const createResponse = await client.makeRequest<{ data: BigCommerceProduct }>(
            HttpMethod.POST,
            '/v3/catalog/products',
            createBody
        );

        return {
            status: "created",
            product: createResponse.data
        };
    },
});