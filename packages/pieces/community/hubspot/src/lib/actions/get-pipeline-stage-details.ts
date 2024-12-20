import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { hubspotApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const getPipelineStageDeatilsAction = createAction({
	auth: hubspotAuth,
	name: 'get-pipeline-stage-details',
	displayName: 'Get Pipeline Stage Details',
	description: 'Finds and retrives CRM object pipeline stage details.',
	props: {
		objectType: Property.StaticDropdown({
			displayName: 'Object Type',
			required: true,
			options: {
				disabled: false,
				options: [
					{
						label: 'Tickets',
						value: 'ticket',
					},
					{
						label: 'Deal',
						value: 'deal',
					},
				],
			},
		}),
		pipelineId: Property.ShortText({
			displayName: 'Pipeline ID',
			required: true,
		}),
		stageId: Property.ShortText({
			displayName: 'Stage ID',
			required: true,
		}),
	},
	async run(context) {
		const objectType = context.propsValue.objectType;
		const pipelineId = context.propsValue.pipelineId;
		const stageId = context.propsValue.stageId;

		const stageResponse = await hubspotApiCall({
			accessToken: context.auth.access_token,
			method: HttpMethod.GET,
			resourceUri: `/crm/v3/pipelines/${objectType}/${pipelineId}/stages/${stageId}`,
		});

		return stageResponse;
	},
});
