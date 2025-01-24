import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { MarkdownVariant } from '@activepieces/shared';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { Client } from '@hubspot/api-client';

export const getLineItemAction = createAction({
	auth: hubspotAuth,
	name: 'get-line-item',
	displayName: 'Get Line Item',
	description: 'Gets a line item.',
	props: {
		lineItemId: Property.ShortText({
			displayName: 'Line Item ID',
			description: 'The ID of the line item to get.',
			required: true,
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
		const { lineItemId } = context.propsValue;

		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const defaultLineItemProperties = getDefaultPropertiesForObject(OBJECT_TYPE.LINE_ITEM);
		const client = new Client({ accessToken: context.auth.access_token });

		const lineItemDetails = await client.crm.lineItems.basicApi.getById(lineItemId, [
			...defaultLineItemProperties,
			...additionalPropertiesToRetrieve,
		]);

		return lineItemDetails;
	},
});
