import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../auth';
import {
	pipelineDropdown,
	statusDropdown,
	userDropdown,
	lossReasonDropdown,
} from '../common/props';

export const createLeadAction = createAction({
	auth: kommoAuth,
	name: 'create_lead',
	classification: 'WRITE',
	displayName: 'Create New Lead',
	description: 'Creates a lead in one of your pipelines.',
	audience: 'both',
	aiMetadata: { description: 'Creates a new lead (deal) in a Kommo CRM account with name, optional price, pipeline/status, responsible user, loss reason, and tags. Use when registering a new sales opportunity. Not idempotent — each call creates a separate lead even with identical input.', idempotent: false },
	props: {
		name: Property.ShortText({
			displayName: 'Lead Name',
			placeholder: 'Website redesign for Acme',
			required: true,
		}),
		price: Property.Number({
			displayName: 'Price',
			description: "Deal value, in your account's currency.",
			required: false,
		}),
		responsible_user_id: userDropdown(),
		pipelineId: { ...pipelineDropdown(true), width: 'half' },
		statusId: { ...statusDropdown(true), width: 'half' },
		tags_to_add: Property.Array({
			displayName: 'Tags to Add',
			description: 'Tag names to add to the lead.',
			required: false,
		}),
		loss_reason_id: lossReasonDropdown({ required: false, advanced: true }),
	},
	propertyGroups: [
		{
			key: 'details',
			display: 'section',
			label: 'Details',
			icon: 'text',
			props: ['name', 'price', 'responsible_user_id'],
		},
		{
			key: 'pipeline',
			display: 'section',
			label: 'Pipeline',
			icon: 'sliders',
			props: ['pipelineId', 'statusId'],
		},
		{
			key: 'tags',
			display: 'section',
			label: 'Tags',
			icon: 'tag',
			props: ['tags_to_add'],
		},
	],
	async run(context) {
		const { name, price, statusId, pipelineId, loss_reason_id, responsible_user_id } =
			context.propsValue;

		const tagsToAdd = context.propsValue.tags_to_add ?? [];

		const { apiToken, subdomain } = context.auth.props;

		const body: Record<string, unknown> = {
			name,
		};

		if (!isNil(price)) body['price'] = price;
		if (statusId) body['status_id'] = statusId;
		if (pipelineId) body['pipeline_id'] = pipelineId;
		if (loss_reason_id) body['loss_reason_id'] = loss_reason_id;
		if (responsible_user_id) body['responsible_user_id'] = responsible_user_id;

		if (tagsToAdd.length > 0) {
			body['tags_to_add'] = tagsToAdd.map((tag) => ({ name: tag }));
		}

		const response = await makeRequest({ apiToken, subdomain }, HttpMethod.POST, '/leads', [body]);

		return response;
	},
});
