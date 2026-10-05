import { getHubspotAccessToken, hubspotAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE, MAX_SEARCH_PAGE_SIZE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/pieces-framework';
import { FilterOperatorEnum } from '../common/types';
import { Client } from '@hubspot/api-client';
import { dealSearchOutputSchema } from '../output-schemas';

export const findDealAction = createAction({
	auth: hubspotAuth,
	name: 'find-deal',
	classification: 'SEARCH',
	displayName: 'Find Deal',
	description: 'Finds up to 200 deals matching one or two property values.',
	audience: 'both',
	aiMetadata: { description: 'Search HubSpot deals by one or two property/value pairs (matched with equality) and return the matching deals. Read-only and repeatable. Use this to look up an existing deal before updating or associating it; pick a create action instead when no matching deal should exist.', idempotent: true },
	outputSchema: dealSearchOutputSchema,
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.DEAL,
				displayName: 'Search Property',
				description: 'The property to compare, such as the deal name.',
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
				objectType: OBJECT_TYPE.DEAL,
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
			value: `Returned by default: dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id.

Pick more under **Advanced**.`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
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

		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);

		const response = client.crm.deals.searchApi.doSearch({
			limit: MAX_SEARCH_PAGE_SIZE,
			properties: [...defaultDealProperties, ...additionalPropertiesToRetrieve],
			filterGroups: [{ filters }],
		});

		return response;
	},
});
