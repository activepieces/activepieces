import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod, httpClient, AuthenticationType } from "@activepieces/pieces-common";

export const createProductDescription = createAction({
    name: 'create_product_description',
    displayName: 'Create Product Description',
    description: 'Create a product description using details like name, brand, category, features, and keywords.',
    props: {
        name: Property.ShortText({
            displayName: 'Product Name',
            description: 'The name of the product.',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Product Features / Details',
            description: 'A list of features or details about the product, can be bullet points or a short paragraph.',
            required: true,
        }),
        brand: Property.ShortText({
            displayName: 'Brand',
            description: 'The brand of the product.',
            required: false,
        }),
        category: Property.ShortText({
            displayName: 'Category',
            description: 'The category the product belongs to (e.g., "Electronics", "Skincare").',
            required: false,
        }),
        keywords: Property.Array({
            displayName: 'Keywords',
            description: 'Keywords to include in the product description.',
            required: false,
        }),
        model: Property.StaticDropdown({
            displayName: 'Model',
            description: 'The AI model to use for generation.',
            required: false,
            options: {
                options: [
                    { label: "Gemini 2.0 Flash (Default)", value: "gemini-2-0-flash" },
                    { label: "GPT-4o", value: "gpt-4o" },
                ]
            }
        }),
        temperature: Property.Number({
            displayName: 'Temperature',
            description: 'Controls randomness. Higher values are more creative.',
            required: false,
        }),
    },
    async run(context) {
        const { ...payload } = context.propsValue;

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: 'https://api.textcortex.com/v1/texts/products/descriptions',
            authentication: {
                type: AuthenticationType.BEARER_TOKEN,
                token: context.auth as string,
            },
            body: payload,
        });

        return response.body;
    },
});