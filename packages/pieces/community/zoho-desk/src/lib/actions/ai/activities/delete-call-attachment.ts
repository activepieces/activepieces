import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteCallAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteCallAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_call_attachment',
	outputSchema: zohoDeskDeleteCallAttachmentOutputSchema,
	displayName: 'Delete Call Attachment',
	description: 'Deletes a file attached to a call.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes one file attached to a call (attachment ID from Upload Call Attachment or Get Call).',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		callId: Property.ShortText({
			displayName: 'Call ID',
			description: 'Call ID (from List Calls or Search Calls).',
			required: true,
		}),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from Upload Call Attachment).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, callId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteCallAttachment({ auth: context.auth, orgId, callId, attachmentId });
		return { success: true, callId, attachmentId };
	},
});
