import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pipedriveAuth } from '../auth';
import { PipedriveEnvelope, pipedriveAtomic } from '../common/atomic-helpers';
import { deleteRecordWithAdditionalDataActionOutputSchema } from '../output-schemas';

export const deleteProductAction = createAction({
	auth: pipedriveAuth,
	name: 'delete-product',
	outputSchema: deleteRecordWithAdditionalDataActionOutputSchema,
	classification: 'DESTRUCTIVE',
	displayName: 'Delete Product',
	description: 'Deletes a product from the catalog.',
	audience: 'ai',
	aiMetadata: {
		description:
			'Deletes one product from the product catalog by numeric ID. The product is soft-deleted; Pipedrive purges it after 30 days and it cannot be restored via this piece. To detach a product from a single deal instead, use Remove Product From Deal. Safe to retry: a repeat call on an already deleted record also succeeds.',
		idempotent: true,
	},
	props: {
		productId: Property.Number({
			displayName: 'Product ID',
			description: 'The numeric ID of the product to delete (from Find Product or Find Products).',
			required: true,
		}),
	},
	async run(context) {
		const { productId } = context.propsValue;
		return pipedriveAtomic.call<PipedriveEnvelope<{ id: number }>>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			resourceUri: `/v2/products/${productId}`,
			resourceLabel: `Product ${productId}`,
		});
	},
});
