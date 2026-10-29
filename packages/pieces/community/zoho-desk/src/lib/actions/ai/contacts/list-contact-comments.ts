import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountCommentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListContactCommentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_contact_comments',
	outputSchema: zohoDeskListAccountCommentsOutputSchema,
	displayName: 'List Contact Comments',
	description: 'Lists the comments on a contact.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description: 'Lists the comments on one contact (internal notes).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, contactId, from, limit } = context.propsValue;
		const comments = await zohoDeskApi.listContactComments({
			auth: context.auth,
			orgId,
			contactId,
			from,
			limit,
		});
		return { comments, count: comments.length };
	},
});
