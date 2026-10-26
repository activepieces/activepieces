import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteAccountAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteAccountAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_account_attachment',
	outputSchema: zohoDeskDeleteAccountAttachmentOutputSchema,
	displayName: 'Delete Account Attachment',
	description: 'Deletes a file attached to a account.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one file attached to a account.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Account Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, accountId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteAccountAttachment({
			auth: context.auth,
			orgId,
			accountId,
			attachmentId,
		});
		return { success: true, accountId, attachmentId };
	},
});
