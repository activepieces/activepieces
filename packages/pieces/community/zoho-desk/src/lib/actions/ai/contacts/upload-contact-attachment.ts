import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUploadAccountAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskUploadContactAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_upload_contact_attachment',
	outputSchema: zohoDeskUploadAccountAttachmentOutputSchema,
	displayName: 'Upload Contact Attachment',
	description: 'Attaches a file to a contact.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to one contact. Not idempotent: each call adds another copy.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contactId: zohoDeskAiProps.contactId({ required: true }),
		file: Property.File({ displayName: 'File', description: 'File to attach.', required: true }),
	},
	async run(context) {
		const { orgId, contactId, file } = context.propsValue;
		return await zohoDeskApi.uploadContactAttachment({
			auth: context.auth,
			orgId,
			contactId,
			file,
		});
	},
});
