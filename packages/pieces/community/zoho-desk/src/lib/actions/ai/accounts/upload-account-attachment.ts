import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUploadAccountAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskUploadAccountAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_upload_account_attachment',
	outputSchema: zohoDeskUploadAccountAttachmentOutputSchema,
	displayName: 'Upload Account Attachment',
	description: 'Attaches a file to a account.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to one account. Not idempotent: each call adds another copy.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		accountId: zohoDeskAiProps.accountId({ required: true }),
		file: Property.File({ displayName: 'File', description: 'File to attach.', required: true }),
	},
	async run(context) {
		const { orgId, accountId, file } = context.propsValue;
		return await zohoDeskApi.uploadAccountAttachment({
			auth: context.auth,
			orgId,
			accountId,
			file,
		});
	},
});
