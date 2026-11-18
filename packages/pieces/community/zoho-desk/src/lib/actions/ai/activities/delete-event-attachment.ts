import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteEventAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteEventAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_event_attachment',
	outputSchema: zohoDeskDeleteEventAttachmentOutputSchema,
	displayName: 'Delete Event Attachment',
	description: 'Deletes a file attached to a event.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one file attached to a event.',
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
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Event Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, eventId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteEventAttachment({ auth: context.auth, orgId, eventId, attachmentId });
		return { success: true, eventId, attachmentId };
	},
});
