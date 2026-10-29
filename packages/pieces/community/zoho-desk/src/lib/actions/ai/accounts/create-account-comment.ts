import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateAccountCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_account_comment',
	outputSchema: zohoDeskCreateAccountCommentOutputSchema,
	displayName: 'Create Account Comment',
	description: 'Adds a comment to a account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an internal comment to one account. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		content: Property.LongText({
			displayName: 'Content',
			description: 'Comment text. HTML unless Content Type is plainText.',
			required: true,
		}),
		contentType: Property.StaticDropdown({
			displayName: 'Content Type',
			description: 'Format of Content. Defaults to html.',
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
		const { orgId, accountId, content, contentType } = context.propsValue;
		return await zohoDeskApi.createAccountComment({
			auth: context.auth,
			orgId,
			accountId,
			content,
			contentType,
		});
	},
});
