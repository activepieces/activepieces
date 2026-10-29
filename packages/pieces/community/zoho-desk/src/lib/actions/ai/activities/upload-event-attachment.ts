import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUploadAccountAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskUploadEventAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_upload_event_attachment',
	outputSchema: zohoDeskUploadAccountAttachmentOutputSchema,
	displayName: 'Upload Event Attachment',
	description: 'Attaches a file to a event.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to one event. Not idempotent: each call adds another copy.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		eventId: Property.ShortText({
			displayName: 'Event ID',
			description: 'Event ID (from List Events or Search Events).',
			required: true,
		}),
		file: Property.File({ displayName: 'File', description: 'File to attach.', required: true }),
	},
	async run(context) {
		const { orgId, eventId, file } = context.propsValue;
		return await zohoDeskApi.uploadEventAttachment({ auth: context.auth, orgId, eventId, file });
	},
});
