import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowDeleteCollectionOutputSchema } from '../../../output-schemas';

export const deleteCollectionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_delete_collection',
	outputSchema: webflowDeleteCollectionOutputSchema,
	displayName: 'Delete Collection',
	description: 'Deletes a CMS collection and all of its items.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Permanently deletes a CMS collection together with all of its items and fields; there is no undo. Get the collection id from List Collections.',
		idempotent: false,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
	},
	async run(context) {
		await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.DELETE,
			path: `/v2/collections/${encodeURIComponent(context.propsValue.collectionId)}`,
		});
		return { success: true, collectionId: context.propsValue.collectionId };
	},
});
