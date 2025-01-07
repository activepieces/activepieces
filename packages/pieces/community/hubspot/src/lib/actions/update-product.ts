import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    getDefaultPropertiesForObject,
    standardObjectDynamicProperties,
    standardObjectPropertiesDropdown,

} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/shared';
import { Client } from '@hubspot/api-client';

export const updateProductAction = createAction({
    auth: hubspotAuth,
    name: 'update-product',
    displayName: 'Update Product',
    description: 'Updates a product in Hubspot.',
    props: {
        productId:Property.ShortText({
            displayName:'Product ID',
            description:'The ID of the product to update.',
            required:true
        }),
        objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.PRODUCT,[]),
        markdown: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `### Properties to retrieve:
                                    
                    createdate, description, name, price, tax, hs_lastmodifieddate
                                            
                    **Specify here a list of additional properties to retrieve**`,
        }),
        additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
            objectType: OBJECT_TYPE.PRODUCT,
            displayName: 'Additional properties to retrieve',
            required: false,
        }),
    },
    async run(context) {
        const productId = context.propsValue.productId;
        const objectProperties = context.propsValue.objectProperties ?? {};
        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const productProperties: Record<string, string> = {};

        // Add additional properties to the productProperties object
        Object.entries(objectProperties).forEach(([key, value]) => {
            // Format values if they are arrays
            productProperties[key] = Array.isArray(value) ? value.join(';') : value;
        });

        const client = new Client({ accessToken: context.auth.access_token });

        const updatedProduct = await client.crm.products.basicApi.update(productId, {
            properties: productProperties,
        });
        // Retrieve default properties for the product and merge with additional properties to retrieve
        const defaultproductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);

        const productDetails = await client.crm.products.basicApi.getById(updatedProduct.id, [
            ...defaultproductProperties,
            ...additionalPropertiesToRetrieve,
        ]);

        return productDetails;
    },
});
