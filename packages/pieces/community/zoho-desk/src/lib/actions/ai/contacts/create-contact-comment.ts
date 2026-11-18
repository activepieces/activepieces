import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskCreateContactCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_create_contact_comment',
	outputSchema: zohoDeskCreateAccountCommentOutputSchema,
	displayName: 'Create Contact Comment',
	description: 'Adds a comment to a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an internal comment to one contact. Not idempotent: each call adds another comment.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
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
		const { orgId, contactId, content, contentType } = context.propsValue;
		return await zohoDeskApi.createContactComment({
			auth: context.auth,
			orgId,
			contactId,
			content,
			contentType,
		});
	},
});
