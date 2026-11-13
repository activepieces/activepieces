import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskUploadAccountAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskUploadProductAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_upload_product_attachment',
	outputSchema: zohoDeskUploadAccountAttachmentOutputSchema,
	displayName: 'Upload Product Attachment',
	description: 'Attaches a file to a product.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Uploads a file and attaches it to one product. Not idempotent: each call adds another copy.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		file: Property.File({ displayName: 'File', description: 'File to attach.', required: true }),
	},
	async run(context) {
		const { orgId, productId, file } = context.propsValue;
		return await zohoDeskApi.uploadProductAttachment({
			auth: context.auth,
			orgId,
			productId,
			file,
		});
	},
});
