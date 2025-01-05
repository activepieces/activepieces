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

export const createProductAction = createAction({
    auth: hubspotAuth,
    name: 'create-product',
    displayName: 'Create Product',
    description: 'Creates a product in Hubspot.',
    props: {
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
        const objectProperties = context.propsValue.objectProperties ?? {};
        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const productProperties: Record<string, string> = {};

        // Add additional properties to the productProperties object
        Object.entries(objectProperties).forEach(([key, value]) => {
            // Format values if they are arrays
            productProperties[key] = Array.isArray(value) ? value.join(';') : value;
        });

        const client = new Client({ accessToken: context.auth.access_token });

        const createdProduct = await client.crm.products.basicApi.create({
            properties: productProperties,
        });
        // Retrieve default properties for the product and merge with additional properties to retrieve
        const defaultproductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);

        const productDetails = await client.crm.products.basicApi.getById(createdProduct.id, [
            ...defaultproductProperties,
            ...additionalPropertiesToRetrieve,
        ]);

        return productDetails;
    },
});
