import { createAction } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowApi } from '../../../common/api';
import { webflowCreateCollectionOutputSchema } from '../../../output-schemas';

export const getCollectionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_get_collection',
	outputSchema: webflowCreateCollectionOutputSchema,
	displayName: 'Get Collection',
	description: 'Gets a CMS collection with its fields.',
	audience: 'ai',
	classification: 'READ',
	aiMetadata: {
		description:
			"Returns one CMS collection's name, slug, field groups and every field with its id, slug, type, required flag and validations (Option choices, Reference target). Read it before writing items to learn the field slugs. Get the collection id from List Collections.",
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
	},
	async run(context) {
		return await webflowApi.getCollection({
			auth: context.auth,
			collectionId: context.propsValue.collectionId,
		});
	},
});
