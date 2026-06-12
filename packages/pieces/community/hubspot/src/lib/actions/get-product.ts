import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../auth';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getProductAction = createAction({
	auth: hubspotAuth,
	name: 'get-product',
	displayName: 'Get Product',
	description: 'Gets a product.',
	audience: 'both',
	aiMetadata: { description: 'Fetch a single HubSpot product by its product ID, returning its default and any requested additional properties. Read-only and repeatable. Use Find Product when you only know property values rather than the ID.', idempotent: true },
	props: {
		productId: Property.ShortText({
			displayName: 'Product ID',
			description: 'The ID of the product to get.',
			required: true,
		}),
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
		const { productId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);

		const client = new Client({ accessToken: context.auth.access_token });

		const productDetails = await client.crm.products.basicApi.getById(productId, [
			...defaultProductProperties,
			...additionalPropertiesToRetrieve,
		]);

		return productDetails;
	},
});
