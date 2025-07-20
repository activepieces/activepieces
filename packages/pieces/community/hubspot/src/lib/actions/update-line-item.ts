import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import {
    getDefaultPropertiesForObject,
    productDropdown,
    standardObjectDynamicProperties,
    standardObjectPropertiesDropdown,
} from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/shared';

import { Client } from '@hubspot/api-client';

export const updateLineItemAction = createAction({
    auth: hubspotAuth,
    name: 'update-line-item',
    displayName: 'Update Line Item',
    description: 'Updates a line item in Hubspot.',
    props: {
        lineItemId: Property.ShortText({
            displayName: 'Line Item ID',
            description: 'The ID of the line item to update.',
            required: true,
        }),
        productId: productDropdown({
            displayName: 'Line Item Information: Product ID',
            required: false,
            objectType: OBJECT_TYPE.PRODUCT,
        }),
        objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.LINE_ITEM, ['hs_product_id']),
        markdown: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `### Properties to retrieve:
                                            
                    name, description, price, quantity, amount, discount, tax, createdate, hs_object_id, hs_product_id, hs_images, hs_lastmodifieddate, hs_line_item_currency_code, hs_sku, hs_url, hs_cost_of_goods_sold, hs_discount_percentage, hs_term_in_months           
                
                    **Specify here a list of additional properties to retrieve**`,
        }),
        additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
            objectType: OBJECT_TYPE.LINE_ITEM,
            displayName: 'Additional properties to retrieve',
            required: false,
        }),
    },
    async run(context) {
        const lineItemId = context.propsValue.lineItemId;
        const productId = context.propsValue.productId;
        const objectProperties = context.propsValue.objectProperties ?? {};
        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const lineItemProperties: Record<string, string> = {
            hs_product_id: productId!,
        };

        if(productId)
        {
            lineItemProperties['hs_product_id'] = productId;
        }

        // Add additional properties to the lineItemProperties object
        Object.entries(objectProperties).forEach(([key, value]) => {
            // Format values if they are arrays
            lineItemProperties[key] = Array.isArray(value) ? value.join(';') : value;
        });

        const client = new Client({ accessToken: context.auth.access_token });

        const createdLineItem = await client.crm.lineItems.basicApi.update(lineItemId, {
            properties: lineItemProperties,
        });
        // Retrieve default properties for the line item and merge with additional properties to retrieve
        const defaultlineItemProperties = getDefaultPropertiesForObject(OBJECT_TYPE.LINE_ITEM);

        const lineItemDetails = await client.crm.lineItems.basicApi.getById(createdLineItem.id, [
            ...defaultlineItemProperties,
            ...additionalPropertiesToRetrieve,
        ]);

        return lineItemDetails;
    },
});
