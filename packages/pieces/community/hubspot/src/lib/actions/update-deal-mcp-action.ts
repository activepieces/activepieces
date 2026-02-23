import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotAuth } from '../../';
import { Client } from '@hubspot/api-client';
import { standardObjectDynamicProperties, pipelineDropdown, pipelineStageDropdown } from '../common/props';
import { OBJECT_TYPE } from '../common/constants';

export const hubspotUpdateDealAction = createAction({
	auth: hubspotAuth,
	name: 'update_deal_mcp',
	displayName: 'Update Deal',
	description: 'Update an existing deal in HubSpot',
	props: {
		dealId: Property.ShortText({
			displayName: 'Deal ID',
			description: 'The ID of the deal to update',
			required: true,
		}),
		dealName: Property.ShortText({
			displayName: 'Deal Name',
			description: 'The name of the deal',
			required: false,
		}),
		pipeline: pipelineDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Pipeline',
			required: false,
		}),
		dealStage: pipelineStageDropdown({
			objectType: OBJECT_TYPE.DEAL,
			displayName: 'Deal Stage',
			required: false,
		}),
		additionalProperties: standardObjectDynamicProperties(OBJECT_TYPE.DEAL, ['dealname', 'pipeline', 'dealstage']),
	},
	async run(context) {
		const client = new Client({ accessToken: context.auth.access_token });
		const properties: Record<string, string> = {};
		
		if (context.propsValue.dealName) properties.dealname = context.propsValue.dealName;
		if (context.propsValue.pipeline) properties.pipeline = context.propsValue.pipeline;
		if (context.propsValue.dealStage) properties.dealstage = context.propsValue.dealStage;

		const additionalProps = context.propsValue.additionalProperties;
		if (additionalProps) {
			Object.entries(additionalProps).forEach(([key, value]) => {
				if (value !== undefined && value !== null) {
					properties[key] = value.toString();
				}
			});
		}

		return await client.crm.deals.basicApi.update(context.propsValue.dealId, {
			properties,
		});
	},
});
