import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListCallCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListCallCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_call_comments',
	outputSchema: zohoDeskListCallCommentsOutputSchema,
	displayName: 'List Call Comments',
	description: 'Lists the comments on a call.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: { description: 'Lists the comments on one call (agent notes).', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		callId: Property.ShortText({
			displayName: 'Call ID',
			description: 'Call ID (from List Calls or Search Calls).',
			required: true,
		}),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, callId, from, limit } = context.propsValue;
		const comments = await zohoDeskApi.listCallComments({
			auth: context.auth,
			orgId,
			callId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
