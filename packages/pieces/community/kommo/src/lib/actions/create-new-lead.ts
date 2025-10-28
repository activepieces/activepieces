import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../../index';
import {
	pipelineDropdown,
	statusDropdown,
	userDropdown,
	lossReasonDropdown,
} from '../common/props';

export const createLeadAction = createAction({
	auth: kommoAuth,
	name: 'create_lead',
	displayName: 'Create New Lead',
	description: 'Creates a new lead.',
	props: {
		name: Property.ShortText({
			displayName: 'Lead Name',
			required: true,
		}),
		price: Property.Number({
			displayName: 'Price',
			required: false,
		}),
		pipelineId: pipelineDropdown(true),
		statusId: statusDropdown(true),
		responsible_user_id: userDropdown(),
		loss_reason_id: lossReasonDropdown(),
		tags_to_add: Property.Array({
			displayName: 'Tags to Add',
			description: 'List of tags to add.',
			required: false,
		}),
	},
	async run(context) {
		const { name, price, statusId, pipelineId, loss_reason_id, responsible_user_id } =
			context.propsValue;

		const tagsToAdd = context.propsValue.tags_to_add ?? [];

		const { apiToken, subdomain } = context.auth;

		const body: Record<string, unknown> = {
			name,
		};

		if (price) body['price'] = price;
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
