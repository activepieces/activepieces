import { createAction, Property } from '@activepieces/pieces-framework';

import { Client } from '@hubspot/api-client';
import { MarkdownVariant } from '@activepieces/shared';
import { hubspotAuth } from '../../';
import { getDefaultPropertiesForObject, standardObjectPropertiesDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const getDealAction = createAction({
	auth: hubspotAuth,
	name: 'get-deal',
	displayName: 'Get Deal',
	description: 'Gets a deal.',
	props: {
		dealId: Property.ShortText({
			displayName: 'Deal ID',
			description: 'The ID of the deal to get.',
			required: true,
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
		const { dealId } = context.propsValue;
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve??[];


		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);

		const client = new Client({ accessToken: context.auth.access_token });

		const dealDetails = await client.crm.deals.basicApi.getById(dealId, [
			...defaultDealProperties,
			...additionalPropertiesToRetrieve,
		]);
		return dealDetails;
	},
});
