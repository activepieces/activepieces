import { createAction, Property } from '@activepieces/pieces-framework';

import { qdrantAuth } from '../../auth';
import { qdrantAiProps } from '../../common/ai-props';
import { qdrantApi } from '../../common/api';
import { qdrantUtils } from '../../common/utils';
import { qdrantUpdateResultOutputSchema } from '../../output-schemas';

export const deleteVectorsAction = createAction({
	auth: qdrantAuth,
	name: 'qdrant_delete_vectors',
	outputSchema: qdrantUpdateResultOutputSchema,
	displayName: 'Delete Vectors',
	description: 'Removes named vectors from points.',
	audience: 'ai',
	classification: 'DESTRUCTIVE',
	aiMetadata: {
		description:
			'Remove the given named vectors from the points selected by exactly one of Point IDs or Filter. The points and their other vectors stay; the unnamed vector cannot be removed.',
		idempotent: false,
	},
	props: {
		collectionName: qdrantAiProps.collectionName({ required: true }),
		vectorNames: Property.Array({
			displayName: 'Vector Names',
			description:
				'Names of the named vectors to remove, e.g. ["image"]. Get Collection lists the names.',
			required: true,
		}),
		pointIds: qdrantAiProps.pointIds({ required: false }),
		filter: qdrantAiProps.filter({ required: false }),
	},
	run: async ({ auth, propsValue }) => {
		return await qdrantApi.deleteVectors({
			auth,
			collectionName: propsValue.collectionName,
			body: {
				vector: qdrantUtils.requireItems({
					items: propsValue.vectorNames,
					propName: 'Vector Names',
				}),
				...qdrantUtils.pointsSelector({ pointIds: propsValue.pointIds, filter: propsValue.filter }),
			},
		});
	},
});
