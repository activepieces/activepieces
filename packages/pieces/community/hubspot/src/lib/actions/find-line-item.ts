import { MarkdownVariant } from '@activepieces/shared';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { hubspotAuth } from '../../';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { FilterOperatorEnum } from '../common/types';

export const findLineItemAction = createAction({
    auth: hubspotAuth,
    name: 'find-line-item',
    displayName: 'Find Line Item',
    description: 'Finds a line item by searching.',
    props: {
        firstSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.LINE_ITEM,
                displayName: 'First search property name',
                required: true,
            },
            true,
            true,
        ),
        firstSearchPropertyValue: Property.ShortText({
            displayName: 'First search property value',
            required: true,
        }),
        secondSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.LINE_ITEM,
                displayName: 'Second search property name',
                required: false,
            },
            true,
            true,
        ),
        secondSearchPropertyValue: Property.ShortText({
            displayName: 'Second search property value',
            required: false,
        }),
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
        const {
            firstSearchPropertyName,
            firstSearchPropertyValue,
            secondSearchPropertyName,
            secondSearchPropertyValue,
        } = context.propsValue;

        const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

        const filters = [
            {
                propertyName: firstSearchPropertyName as string,
                operator: FilterOperatorEnum.Eq,
                value: firstSearchPropertyValue,
            },
        ];

        if (secondSearchPropertyName && secondSearchPropertyValue) {
            filters.push({
                propertyName: secondSearchPropertyName as string,
                operator: FilterOperatorEnum.Eq,
                value: secondSearchPropertyValue,
            });
        }

        const client = new Client({ accessToken: context.auth.access_token });

        const defaultLineItemProperties = getDefaultPropertiesForObject(OBJECT_TYPE.LINE_ITEM);

        const response = client.crm.lineItems.searchApi.doSearch({
            limit: 100,
            properties: [...defaultLineItemProperties, ...additionalPropertiesToRetrieve],
            filterGroups: [{ filters }],
        });

        return response;
    },
});
