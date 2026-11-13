import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeUtils } from '../../common/utils';
import { pineconeCreateNamespaceOutputSchema } from '../../output-schemas';

export const pineconeCreateNamespaceAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_create_namespace',
	outputSchema: pineconeCreateNamespaceOutputSchema,
	displayName: 'Create Namespace',
	description: 'Creates an empty namespace in a serverless index.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Creates an empty namespace in a serverless index, optionally listing the metadata fields to index for filtering (other fields are then not filterable). Writing records to a new namespace also creates it, so this is only needed to set filterable fields up front.',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		name: Property.ShortText({
			displayName: 'Namespace Name',
			description: 'Name of the new namespace.',
			required: true,
		}),
		filterableFields: Property.Array({
			displayName: 'Filterable Metadata Fields',
			description:
				'Metadata field names to index for filtering, e.g. ["genre", "year"]. Leave empty to index every field.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({ name: p.indexName });
		const filterableFields = p.filterableFields
			? pineconeUtils.toStringList({
					value: p.filterableFields,
					propName: 'Filterable Metadata Fields',
			  })
			: undefined;
		return await index.createNamespace({
			name: p.name,
			...(filterableFields !== undefined
				? {
						schema: {
							fields: Object.fromEntries(
								filterableFields.map((field) => [field, { filterable: true }]),
							),
						},
				  }
				: {}),
		});
	},
});
