import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateAccountCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_account_comment',
	outputSchema: zohoDeskCreateAccountCommentOutputSchema,
	displayName: 'Update Account Comment',
	description: 'Edits a comment on a account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Replaces the text of one comment on a account.', idempotent: true },
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
		content: Property.LongText({
			displayName: 'Content',
			description: 'New comment text.',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'html', value: 'html' },
					{ label: 'plainText', value: 'plainText' },
				],
			},
		}),
	},
	async run(context) {
		const { orgId, accountId, commentId, content, contentType } = context.propsValue;
		return await zohoDeskApi.updateAccountComment({
			auth: context.auth,
			orgId,
			accountId,
			commentId,
			content,
			contentType,
		});
	},
});
