import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountHistoryOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactHistoryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_history',
	outputSchema: zohoDeskListAccountHistoryOutputSchema,
	displayName: 'List Contact History',
	description: 'Lists the activity history of a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the activity history of one contact (tickets, replies, field changes), optionally only by one agent or in one department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		agentId: zohoDeskAiProps.agentId({ required: false }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, agentId, departmentId, from, limit } = context.propsValue;
		const history = await zohoDeskApi.listContactHistory({
			auth: context.auth,
			orgId,
			contactId,
			agentId,
			departmentId,
			from,
			limit,
		});
		return { history, count: history.length };
	},
});
