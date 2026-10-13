import { MarkdownVariant } from '@activepieces/pieces-framework';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown

 } from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { Client } from '@hubspot/api-client';
import { FilterOperatorEnum } from '../common/types';
import { productSearchOutputSchema } from '../output-schemas';

export const findProductAction = createAction({
	auth: hubspotAuth,
	name: 'find-product',
	classification: 'SEARCH',
	displayName: 'Find Product',
	description: 'Finds up to 200 products matching one or two property values.',
	audience: 'both',
	aiMetadata: { description: 'Search the HubSpot product library by one or two property/value pairs (matched with equality) and return the matching products. Read-only and repeatable. Use Get Product instead when you already have the product ID.', idempotent: true },
	outputSchema: productSearchOutputSchema,
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.PRODUCT,
				displayName: 'Search Property',
				description: 'The property to compare, such as the SKU.',
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
				objectType: OBJECT_TYPE.PRODUCT,
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
			value: `Returned by default: createdate, description, name, price, tax, hs_lastmodifieddate.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.PRODUCT,
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

		const defaultProductProperties = getDefaultPropertiesForObject(OBJECT_TYPE.PRODUCT);

		const response = await client.crm.products.searchApi.doSearch({
			limit: MAX_SEARCH_PAGE_SIZE,
			properties: [...defaultProductProperties, ...additionalPropertiesToRetrieve],
			filterGroups: [{ filters }],
		});
		return response;
	},
});
