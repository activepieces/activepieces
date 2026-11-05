import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteContactAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteContactAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_contact_attachment',
	outputSchema: zohoDeskDeleteContactAttachmentOutputSchema,
	displayName: 'Delete Contact Attachment',
	description: 'Deletes a file attached to a contact.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one file attached to a contact.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Contact Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contactId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteContactAttachment({
			auth: context.auth,
			orgId,
			contactId,
			attachmentId,
		});
		return { success: true, contactId, attachmentId };
	},
});
