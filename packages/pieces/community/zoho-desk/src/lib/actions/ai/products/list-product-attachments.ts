import { createAction } from '@activepieces/pieces-framework';

import { zohoDeskAuth } from '../../../auth';
import { zohoDeskAiProps } from '../../../common/ai-props';
import { zohoDeskApi } from '../../../common/api';
import { zohoDeskProps } from '../../../common/props';
import { zohoDeskListAccountAttachmentsOutputSchema } from '../../../output-schemas';

export const zohoDeskListProductAttachmentsAction = createAction({
	auth: zohoDeskAuth,
	name: 'zoho_desk_list_product_attachments',
	outputSchema: zohoDeskListAccountAttachmentsOutputSchema,
	displayName: 'List Product Attachments',
	description: 'Lists the files attached to a product.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists the files attached to one product, with name, size and download link (`href`).',
		idempotent: true,
	},
	props: {
		orgId: zohoDeskProps.orgId({
			required: true,
			description: 'Zoho Desk organization ID (from List Organizations).',
		}),
		productId: zohoDeskAiProps.productId({ required: true }),
		from: zohoDeskAiProps.from({ required: false }),
		limit: zohoDeskAiProps.limit({ required: false }),
	},
	async run(context) {
		const { orgId, productId, from, limit } = context.propsValue;
		const attachments = await zohoDeskApi.listProductAttachments({
			auth: context.auth,
			orgId,
			productId,
			from,
			limit,
		});
		return { attachments, count: attachments.length };
	},
});
