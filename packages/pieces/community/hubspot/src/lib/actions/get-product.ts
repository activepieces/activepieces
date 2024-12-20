import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';
import { additionalPropertyNamesDropdown, getDefaultProperties } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getProductAction = createAction({
    auth: hubspotAuth,
    name: 'get-product',
    displayName: 'Get Product',
    description: 'Gets a product.',
    props: {
        productId : Property.ShortText({
            displayName: 'Product ID',
            description: 'The ID of the product to get.',
            required: true,
        }),
        additionalProperties:additionalPropertyNamesDropdown(OBJECT_TYPE.PRODUCT)

    },
    async run(context) {
        const productId = context.propsValue.productId;
        const additionalProperties = context.propsValue.additionalProperties ?? [];

        const defaultProperties = getDefaultProperties(OBJECT_TYPE.PRODUCT)

        const productResponse = await hubspotApiCall({
            accessToken: context.auth.access_token,
            method: HttpMethod.GET,
            resourceUri:`/crm/v3/objects/products/${productId}`,
            query:{
                properties: [...defaultProperties, ...additionalProperties].join(',')
            }
        })

        return productResponse;
    },
});
