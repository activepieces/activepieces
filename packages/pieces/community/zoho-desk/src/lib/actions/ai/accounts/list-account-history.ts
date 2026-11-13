import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountHistoryOutputSchema } from '../../../output-schemas';

export const zohoDeskListAccountHistoryAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_account_history',
	outputSchema: zohoDeskListAccountHistoryOutputSchema,
	displayName: 'List Account History',
	description: 'Lists the activity history of an account.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the activity history of one account, optionally only for one contact, agent or department.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		contactId: zohoDeskAiProps.contactId({ required: false }),
		agentId: zohoDeskAiProps.agentId({ required: false }),
		departmentId: zohoDeskAiProps.departmentId({ required: false }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, accountId, contactId, agentId, departmentId, from, limit } = context.propsValue;
		const history = await zohoDeskApi.listAccountHistory({
			auth: context.auth,
			orgId,
			accountId,
			contactId,
			agentId,
			departmentId,
			from,
			limit,
		});
		return { history, count: history.length };
	},
});
