import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { webflowAuth } from '../../../auth';
import { webflowAiProps } from '../../../common/ai-props';
import { webflowClient } from '../../../common/client';
import { webflowUpdateCollectionOutputSchema } from '../../../output-schemas';

export const updateCollectionAction = createAction({
	auth: webflowAuth,
	name: 'webflow_update_collection',
	outputSchema: webflowUpdateCollectionOutputSchema,
	displayName: 'Update Collection',
	description: "Updates a CMS collection's name, singular name, slug or field groups.",
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			"Changes a CMS collection's name, singular name, slug or field groups; only the values given are changed. Field Groups replaces all existing groups. To change fields use Update Collection Field. Get the collection id from List Collections and field ids from Get Collection.",
		idempotent: true,
	},
	props: {
		collectionId: webflowAiProps.collectionId({ required: true }),
		displayName: Property.ShortText({
			displayName: 'Name',
			description: 'New plural name of the collection, e.g. "Blog Posts".',
			required: false,
		}),
		singularName: Property.ShortText({
			displayName: 'Singular Name',
			description: 'New name of one item, e.g. "Blog Post".',
			required: false,
		}),
		slug: Property.ShortText({
			displayName: 'Slug',
			description: 'New URL part for the collection, e.g. "blog-posts".',
			required: false,
		}),
		fieldGroups: Property.Json({
			displayName: 'Field Groups',
			description:
				'Replaces all field groups. JSON array, each {"displayName", "fieldIds": [...], "description"?}. Names and field ids must be unique across groups; at most 50 groups. Not supported on Ecommerce collections.',
			required: false,
		}),
	},
	async run(context) {
		const { collectionId, displayName, singularName, slug, fieldGroups } = context.propsValue;
		if (fieldGroups !== undefined && !Array.isArray(fieldGroups)) {
			throw new Error('fieldGroups must be a JSON array of field group objects.');
		}
		if (displayName === undefined && singularName === undefined && slug === undefined && fieldGroups === undefined) {
			throw new Error('Set at least one of displayName, singularName, slug or fieldGroups.');
		}
		return await webflowClient.request<unknown>({
			auth: context.auth,
			method: HttpMethod.PATCH,
			path: `/v2/collections/${encodeURIComponent(collectionId)}`,
			body: {
				...(displayName !== undefined ? { displayName } : {}),
				...(singularName !== undefined ? { singularName } : {}),
				...(slug !== undefined ? { slug } : {}),
				...(fieldGroups !== undefined ? { fieldGroups } : {}),
			},
		});
	},
});
