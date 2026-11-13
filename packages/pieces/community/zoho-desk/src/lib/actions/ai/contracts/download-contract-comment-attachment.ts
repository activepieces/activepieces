import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDownloadContractCommentAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDownloadContractCommentAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_download_contract_comment_attachment',
	outputSchema: zohoDeskDownloadContractCommentAttachmentOutputSchema,
	displayName: 'Download Contract Comment Attachment',
	description: 'Downloads a file attached to a contract comment.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			'Downloads one file attached to a contract comment and returns it as a file. Attachment IDs come from Get Contract Comment.',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		contractId: Property.ShortText({
			displayName: 'Contract ID',
			description: 'Contract ID (from List Contracts or List Account Contracts).',
			required: true,
		}),
		commentId: Property.ShortText({
			displayName: 'Comment ID',
			description: 'Comment ID (from List Contract Comments).',
			required: true,
		}),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from Get Contract Comment).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, contractId, commentId, attachmentId } = context.propsValue;
		const file = await zohoDeskApi.downloadContractCommentAttachment({
			auth: context.auth,
			orgId,
			contractId,
			commentId,
			attachmentId,
		});
		const fileName = file.fileName ?? attachmentId;
		return { fileName, file: await context.files.write({ fileName, data: file.data }) };
	},
});
