import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListCallCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContractCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contract_comments',
	outputSchema: zohoDeskListCallCommentsOutputSchema,
	displayName: 'List Contract Comments',
	description: 'Lists the comments on a contract.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the comments on one contract (agent notes).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contractId: Property.ShortText({
			displayName: 'Contract ID',
			description: 'Contract ID (from List Contracts or List Account Contracts).',
			required: true,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contractId, from, limit } = context.propsValue;
		const comments = await zohoDeskApi.listContractComments({
			auth: context.auth,
			orgId,
			contractId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
