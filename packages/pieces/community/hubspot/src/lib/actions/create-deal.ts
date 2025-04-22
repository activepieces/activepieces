import { hubspotAuth } from '../../';

import { Property, createAction } from '@activepieces/pieces-framework';

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

export const createDealAction = createAction({
	auth: hubspotAuth,
	name: 'create-deal',
	displayName: 'Create Deal',
	description: 'Creates a new deal in Hubspot.',
	props: {
		dealname: Property.ShortText({
			displayName: 'Deal Name',
			required: true,
		}),
		pipelineId: pipelineDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Deal Pipeline',
			required: true,
		}),
		pipelineStageId: pipelineStageDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Deal Stage',
			required: true,
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
		const { dealname, pipelineId, pipelineStageId } = context.propsValue;
		const objectProperties = context.propsValue.objectProperties ?? {};
		const additionalPropertiesToRetrieve = context.propsValue.additionalPropertiesToRetrieve ?? [];

		const dealProperties: Record<string, string> = {
			dealname,
			pipeline: pipelineId!,
			dealstage: pipelineStageId!,
		};

		// Add additional properties to the dealProperties object
		Object.entries(objectProperties).forEach(([key, value]) => {
			// Format values if they are arrays
			dealProperties[key] = Array.isArray(value) ? value.join(';') : value;
		});

		const client = new Client({ accessToken: context.auth.access_token });

		const createdDeal = await client.crm.deals.basicApi.create({
			properties: dealProperties,
		});
		// Retrieve default properties for the deal and merge with additional properties to retrieve
		const defaultDealProperties = getDefaultPropertiesForObject(OBJECT_TYPE.DEAL);

		const dealDetails = await client.crm.deals.basicApi.getById(createdDeal.id, [
			...defaultDealProperties,
			...additionalPropertiesToRetrieve,
		]);

		return dealDetails;
	},
});

