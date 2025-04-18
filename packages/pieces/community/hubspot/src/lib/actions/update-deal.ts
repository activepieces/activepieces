import { hubspotAuth } from '../../';

import {
	Property,
	createAction,
} from '@activepieces/pieces-framework';

import { MarkdownVariant } from '@activepieces/shared';
import { OBJECT_TYPE } from '../common/constants';
import {
	getDefaultPropertiesForObject,
	pipelineDropdown,
	pipelineStageDropdown,
	standardObjectDynamicProperties,
	standardObjectPropertiesDropdown,
} from '../common/props';

import { Client } from '@hubspot/api-client';

export const updateDealAction = createAction({
	auth: hubspotAuth,
	name: 'update-deal',
	displayName: 'Update Deal',
	description: 'Updates a deal in HubSpot.',
	props: {
		dealId: Property.ShortText({
			displayName: 'Deal ID',
			description: 'The ID of the deal to update.',
			required: true,
		}),
		dealname: Property.ShortText({
			displayName: 'Deal Name',
			required: false,
		}),
		pipelineId: pipelineDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Deal Pipeline',
			required: false,
		}),
		pipelineStageId: pipelineStageDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Deal Stage',
			required: false,
		}),
		objectProperties: standardObjectDynamicProperties(OBJECT_TYPE.DEAL, [
			'dealname',
			'pipeline',
			'dealstage',
		]),
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
		const { dealId, dealname, pipelineId, pipelineStageId } = context.propsValue;
		const objectProperties = context.propsValue.objectProperties ?? {};
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const dealProperties: Record<string, string> = {};

		if (dealname) {
			dealProperties['dealname'] = dealname;
		}
		if (pipelineId) {
			dealProperties['pipeline'] = pipelineId;
		}
		if (pipelineStageId) {
			dealProperties['dealstage'] = pipelineStageId;
		}

		// Add additional properties to the dealProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			dealProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const updatedDeal = await client.crm.deals.basicApi.update(dealId, {
			properties: dealProperties,
		});
		// Retrieve default properties for the deal and merge with additional properties to retrieve
		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);

		const dealDetails = await client.crm.deals.basicApi.getById(updatedDeal.id, [
			...defaultDealProperties,
			...additionalPropertiesToRetrieve,
		]);

		return dealDetails;
	},
});

