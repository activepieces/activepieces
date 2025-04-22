import { hubspotAuth } from '../../';
import { createAction, Property } from '@activepieces/pieces-framework';
import { Client } from '@hubspot/api-client';

export const getPipelineStageDetailsAction = createAction({
	auth: hubspotAuth,
	name: 'get-pipeline-stage-details',
	displayName: 'Get Pipeline Stage Details',
	description: 'Finds and retrieves CRM object pipeline stage details.',
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

		const client = new Client({ accessToken: context.auth.access_token });

		const response = await client.crm.pipelines.pipelineStagesApi.getById(
			objectType,
			pipelineId,
			stageId,
		);

		return response;
	},
});
