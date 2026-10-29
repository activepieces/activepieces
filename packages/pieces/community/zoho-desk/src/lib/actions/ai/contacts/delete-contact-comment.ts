import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteContactCommentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteContactCommentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_contact_comment',
	outputSchema: zohoDeskDeleteContactCommentOutputSchema,
	displayName: 'Delete Contact Comment',
	description: 'Deletes a comment from a contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: { description: 'Permanently deletes one comment from a contact.', idempotent: false },
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
	},
	async run(context) {
		const { orgId, contactId, commentId } = context.propsValue;
		await zohoDeskApi.deleteContactComment({ auth: context.auth, orgId, contactId, commentId });
		return { success: true, contactId, commentId };
	},
});
