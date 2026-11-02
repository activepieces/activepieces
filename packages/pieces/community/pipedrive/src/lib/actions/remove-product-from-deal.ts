import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordWithAdditionalDataActionOutputSchema } from '../output-schemas';

export const removeProductFromDealAction = createAction({
	auth: pipedriveAuth,
	name: 'remove-product-from-deal',
	outputSchema: deleteRecordWithAdditionalDataActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Remove Product From Deal',
	description: 'Removes a product line from a deal.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Removes one product line from a deal; the product itself stays in the catalog. Needs the row id returned by List Deal Products (the attachment ID), not the product_id. Not safe to retry blindly.',
		idempotent: false,
	},
	props: {
		dealId: Property.Number({
			displayName: 'Deal ID',
			description: 'The numeric ID of the deal the product is attached to.',
			required: true,
		}),
		productAttachmentId: Property.Number({
			displayName: 'Deal Product ID',
			description:
				'The id of the row returned by List Deal Products (the attachment ID). This is not the product_id.',
			required: true,
		}),
	},
	async run(context) {
		const { dealId, productAttachmentId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: number }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v2/deals/${dealId}/products/${productAttachmentId}`,
			resourceLabel: `Product line ${productAttachmentId} on deal ${dealId}`,
		});
	},
});
