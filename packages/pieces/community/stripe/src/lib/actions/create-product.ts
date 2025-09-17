import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

export const stripeCreateProduct = createAction({
    name: 'create_product',
    auth: stripeAuth,
    displayName: 'Create Product',
    description: 'Create a product object in Stripe.',
    props: {
        name: Property.ShortText({
            displayName: 'Name',
            description: 'The product’s name, which will be displayed to the customer.',
            required: true,
        }),
        description: Property.LongText({
            displayName: 'Description',
            description: 'An optional description of the product, which will be displayed to the customer.',
            required: false,
        }),
    },
    async run(context) {
        const body: { [key: string]: unknown } = {
            name: context.propsValue.name,
        };

        if (context.propsValue.description) {
            body['description'] = context.propsValue.description;
        }

        const response = await httpClient.sendRequest({
            method: HttpMethod.POST,
            url: `${stripeCommon.baseUrl}/products`,
            headers: {
                'Authorization': 'Bearer ' + context.auth,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body,
        });

        return response.body;
    },
});