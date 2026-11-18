import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskCreateAccountCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskUpdateContactCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_update_contact_comment',
	outputSchema: zohoDeskCreateAccountCommentOutputSchema,
	displayName: 'Update Contact Comment',
	description: 'Edits a comment on a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: { description: 'Replaces the text of one comment on a contact.', idempotent: true },
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Contact Comments).',
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
		const { orgId, contactId, commentId, content, contentType } = context.propsValue;
		return await zohoDeskApi.updateContactComment({
			auth: context.auth,
			orgId,
			contactId,
			commentId,
			content,
			contentType,
		});
	},
});
