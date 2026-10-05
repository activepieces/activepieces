import { MarkdownVariant } from '@activepieces/pieces-framework';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';
import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { customObjectDropdown, customObjectPropertiesDropdown } from '../common/props';
import { FilterOperatorEnum } from '../common/types';
import { MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { customObjectSearchOutputSchema } from '../output-schemas';

export const findCustomObjectAction = createAction({
	auth: hubspotAuth,
	name: 'find-custom-object',
	classification: 'SEARCH',
	displayName: 'Find Custom Object',
	description: 'Finds up to 200 custom object records matching one or two values.',
	audience: 'both',
	aiMetadata: { description: 'Search records of a selected HubSpot custom object type by one or two property/value pairs (matched with equality) and return the matches. Read-only and repeatable. Requires choosing the custom object type; use Create Custom Object to add a new record.', idempotent: true },
	outputSchema: customObjectSearchOutputSchema,
	props: {
		customObjectType: customObjectDropdown,
		firstSearchPropertyName: customObjectPropertiesDropdown({
			displayName: 'Search Property',
			description: 'The property to compare.',
			required: true,
			isSingleSelect: true,
		}),
		firstSearchPropertyValue: Property.ShortText({
			displayName: 'Search Value',
			description: 'Only exact matches are returned.',
			required: true,
		}),
		secondSearchPropertyName: customObjectPropertiesDropdown({
			displayName: 'Second Search Property',
			description: 'Optional second condition; records must match both.',
			required: false,
			isSingleSelect: true,
			advanced: true,
		}),
		secondSearchPropertyValue: Property.ShortText({
			displayName: 'Second Search Value',
			description: 'Ignored unless a second property is also chosen.',
			required: false,
			advanced: true,
		}),
		markdown: Property.MarkDown({
			variant: MarkdownVariant.INFO,
			value: `Returned by default: hs_object_id, hs_lastmodifieddate, hs_createdate.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: customObjectPropertiesDropdown({
			displayName: 'Additional Properties to Retrieve',
			required: false,
			advanced: true,
		}),
	},
	async run(context) {
		const customObjectType = context.propsValue.customObjectType as string;
		const { firstSearchPropertyValue, secondSearchPropertyValue } = context.propsValue;
		const firstSearchPropertyName = context.propsValue.firstSearchPropertyName?.[
			'values'
		] as string;
		const secondSearchPropertyName = context.propsValue.secondSearchPropertyName?.[
			'values'
		] as string;

		const additionalPropertiesToRetrieve =
			context.propsValue.additionalPropertiesToRetrieve?.['values'];

		let propertiesToRetrieve;

		try {
			if (Array.isArray(additionalPropertiesToRetrieve)) {
				propertiesToRetrieve = additionalPropertiesToRetrieve;
			}
			if (typeof additionalPropertiesToRetrieve === 'string') {
				propertiesToRetrieve = JSON.parse(additionalPropertiesToRetrieve as string);
			}
		} catch (error) {
			propertiesToRetrieve = [];
		}

		const filters = [
			{
				propertyName: firstSearchPropertyName as unknown as string,
				operator: FilterOperatorEnum.Eq,
				value: firstSearchPropertyValue,
			},
		];

		if (secondSearchPropertyName && secondSearchPropertyValue) {
			filters.push({
				propertyName: secondSearchPropertyName as unknown as string,
				operator: FilterOperatorEnum.Eq,
				value: secondSearchPropertyValue,
			});
		}

		const client = new Client({ accessToken: getHubspotAccessToken(context.auth) });

		const response = await client.crm.objects.searchApi.doSearch(customObjectType, {
			limit: MAX_SEARCH_PAGE_SIZE,
			properties: propertiesToRetrieve,
			filterGroups: [{ filters }],
		});

		return response;
	},
});
