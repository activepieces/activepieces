import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteAccountCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_account_comment',
	outputSchema: zohoDeskDeleteAccountCommentOutputSchema,
	displayName: 'Delete Account Comment',
	description: 'Deletes a comment from a account.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: { description: 'Permanently deletes one comment from a account.', idempotent: false },
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
		await zohoDeskApi.deleteAccountComment({ auth: context.auth, orgId, accountId, commentId });
		return { success: true, accountId, commentId };
	},
});
