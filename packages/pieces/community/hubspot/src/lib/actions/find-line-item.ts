import { MarkdownVariant } from '@activepieces/pieces-framework';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { FilterOperatorEnum } from '../common/types';
import { lineItemSearchOutputSchema } from '../output-schemas';

export const findLineItemAction = createAction({
    auth: hubspotAuth,
    name: 'find-line-item',
    classification: 'SEARCH',
    displayName: 'Find Line Item',
    description: 'Finds up to 200 line items matching one or two property values.',
    audience: 'both',
    aiMetadata: { description: 'Search HubSpot line items by one or two property/value pairs (matched with equality) and return the matches. Read-only and repeatable. Use this to locate an existing line item before updating it.', idempotent: true },
    outputSchema: lineItemSearchOutputSchema,
    props: {
        firstSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.LINE_ITEM,
                displayName: 'Search Property',
                description: 'The property to compare, such as the line item name.',
                required: true,
            },
            true,
            true,
        ),
        firstSearchPropertyValue: Property.ShortText({
            displayName: 'Search Value',
            description: 'Only exact matches are returned.',
            required: true,
        }),
        secondSearchPropertyName: standardObjectPropertiesDropdown(
            {
                objectType: OBJECT_TYPE.LINE_ITEM,
                displayName: 'Second Search Property',
                description: 'Optional second condition; records must match both.',
                required: false,
                advanced: true,
            },
            true,
            true,
        ),
        secondSearchPropertyValue: Property.ShortText({
            displayName: 'Second Search Value',
            description: 'Ignored unless a second property is also chosen.',
            required: false,
            advanced: true,
        }),
        markdown: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `Returned by default: name, description, price, quantity, amount, discount, tax, createdate, hs_object_id, hs_product_id, hs_images, hs_lastmodifieddate, hs_line_item_currency_code, hs_sku, hs_url, hs_cost_of_goods_sold, hs_discount_percentage, hs_term_in_months.

Pick more under **Advanced**.`,
        }),
        additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
            objectType: OBJECT_TYPE.LINE_ITEM,
            displayName: 'Additional Properties to Retrieve',
            required: false,
            advanced: true,
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

        const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

        const defaultLineItemProperties = getDefaultPropertiesForObject(OBJECT_TYPE.LINE_ITEM);

        const response = client.crm.lineItems.searchApi.doSearch({
            limit: MAX_SEARCH_PAGE_SIZE,
            properties: [...defaultLineItemProperties, ...additionalPropertiesToRetrieve],
            filterGroups: [{ filters }],
        });

        return response;
    },
});
