import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';
import { MarkdownVariant } from '@activepieces/shared';
import { FilterOperatorEnum } from '../common/types';
import { Client } from '@hubspot/api-client';

export const findDealAction = createAction({
	auth: hubspotAuth,
	name: 'find-deal',
	displayName: 'Find Deal',
	description: 'Finds a deal by searching.',
	props: {
		firstSearchPropertyName: standardObjectPropertiesDropdown(
			{
				objectType: OBJECT_TYPE.DEAL,
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
				objectType: OBJECT_TYPE.DEAL,
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
                                                
                      dealtype, dealname, amount, description, closedate, createdate, num_associated_contacts, hs_forecast_amount, hs_forecast_probability, hs_manual_forecast_category, hs_next_step, hs_object_id, hs_lastmodifieddate, hubspot_owner_id, hubspot_team_id
                                                        
                      **Specify here a list of additional properties to retrieve**`,
		}),
		additionalPropertiesToRetrieve: standardObjectPropertiesDropdown({
			objectType: OBJECT_TYPE.DEAL,
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

		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);

		const response = client.crm.deals.searchApi.doSearch({
			limit: 100,
			properties: [...defaultDealProperties, ...additionalPropertiesToRetrieve],
			filterGroups: [{ filters }],
		});

		return response;
	},
});
