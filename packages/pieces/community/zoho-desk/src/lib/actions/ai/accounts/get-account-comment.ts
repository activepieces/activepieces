import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskGetAccountCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_get_account_comment',
	outputSchema: zohoDeskCreateAccountCommentOutputSchema,
	displayName: 'Get Account Comment',
	description: 'Gets one comment on a account.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description: 'Gets one comment on a account, with its author and content.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Account Comments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, accountId, commentId } = context.propsValue;
		return await zohoDeskApi.getAccountComment({ auth: context.auth, orgId, accountId, commentId });
	},
});
