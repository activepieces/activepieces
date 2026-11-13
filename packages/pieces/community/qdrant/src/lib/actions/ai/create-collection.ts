import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantSuccessOutputSchema } from '../../output-schemas';

export const createCollectionAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_create_collection',
	outputSchema: qdrantSuccessOutputSchema,
	displayName: 'Create Collection',
	description: 'Creates a collection.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Create a collection with either one unnamed dense vector (Vector Size and Distance) or several named vectors, plus optional sparse vectors. Fails if the name already exists (check with Collection Exists). Points written later must use exactly these vector sizes and names.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		vectorSize: Property.Number({
			displayName: 'Vector Size',
			description:
				'Dimension of the single unnamed dense vector, e.g. 1536. Set together with Distance, or use Named Vectors instead.',
			required: false,
		}),
		distance: Property.StaticDropdown({
			displayName: 'Distance',
			description: 'Distance metric for the unnamed vector. Required with Vector Size.',
			required: false,
			options: {
				options: [
					{ label: 'Cosine', value: 'Cosine' },
					{ label: 'Euclidean', value: 'Euclid' },
					{ label: 'Dot', value: 'Dot' },
					{ label: 'Manhattan', value: 'Manhattan' },
				],
			},
		}),
		namedVectors: Property.Json({
			displayName: 'Named Vectors',
			description:
				'Named dense vectors as a map of name to parameters, e.g. {"text": {"size": 768, "distance": "Cosine"}, "image": {"size": 512, "distance": "Dot"}}. Use instead of Vector Size.',
			required: false,
		}),
		sparseVectors: Property.Json({
			displayName: 'Sparse Vectors',
			description: 'Named sparse vectors as a map of name to parameters, e.g. {"keywords": {}}.',
			required: false,
		}),
		additionalSettings: Property.Json({
			displayName: 'Additional Settings',
			description:
				'Other create parameters, e.g. {"on_disk_payload": true, "hnsw_config": {"m": 16}}. The fields above take precedence.',
			required: false,
		}),
	},
	run: async ({ auth, propsValue }) => {
		const { vectorSize, distance, namedVectors, sparseVectors, additionalSettings } = propsValue;
		if (vectorSize !== undefined && namedVectors !== undefined) {
			throw new Error('Set either Vector Size or Named Vectors, not both.');
		}
		const created = await qdrantApi.createCollection({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				...additionalSettings,
				...(namedVectors !== undefined ? { vectors: namedVectors } : {}),
				...(vectorSize !== undefined ? { vectors: { size: vectorSize, distance } } : {}),
				...(sparseVectors !== undefined ? { sparse_vectors: sparseVectors } : {}),
			},
		});
		return { success: created };
	},
});
