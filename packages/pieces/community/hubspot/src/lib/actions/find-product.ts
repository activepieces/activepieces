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
	description: 'Finds a product by searching.',
	audience: 'both',
	aiMetadata: { description: 'Search the HubSpot product library by one or two property/value pairs (matched with equality) and return the matching products. Read-only and repeatable. Use Get Product instead when you already have the product ID.', idempotent: true },
	outputSchema: productSearchOutputSchema,
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.PRODUCT,
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
				objectType: OBJECT_TYPE.PRODUCT,
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
