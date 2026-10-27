import { createAction, Property } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskDeleteProductAttachmentOutputSchema } from '../../../output-schemas';

export const zohoDeskDeleteProductAttachmentAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_delete_product_attachment',
	outputSchema: zohoDeskDeleteProductAttachmentOutputSchema,
	displayName: 'Delete Product Attachment',
	description: 'Deletes a file attached to a product.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description: 'Permanently deletes one file attached to a product.',
		idempotent: false,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		attachmentId: Property.ShortText({
			displayName: 'Attachment ID',
			description: 'Attachment ID (from List Product Attachments).',
			required: true,
		}),
	},
	async run(context) {
		const { orgId, productId, attachmentId } = context.propsValue;
		await zohoDeskApi.deleteProductAttachment({
			auth: context.auth,
			orgId,
			productId,
			attachmentId,
		});
		return { success: true, productId, attachmentId };
	},
});
