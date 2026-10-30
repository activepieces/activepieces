import { createAction, Property } from '@activepieces/pieces-framework';

import { pineconeAuth } from '../../auth';
import { pineconeAiProps } from '../../common/ai-props';
import { pineconeClient } from '../../common/client';
import { pineconeStartImportOutputSchema } from '../../output-schemas';

export const pineconeStartImportAction = createAction({
	auth: pineconeAuth,
	name: 'pinecone_start_import',
	outputSchema: pineconeStartImportOutputSchema,
	displayName: 'Start Import',
	description: 'Starts a bulk import of records from object storage into an index.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Starts an asynchronous import of Parquet (vectors indexes) or JSONL (documents indexes) files from an S3, GCS or Azure storage URI into a serverless index, and returns the import ID. Poll it with Get Import. The URI scheme must match the index cloud: s3:// for aws, gs:// for gcp, https:// (Azure Blob) for azure. The import cannot target an existing namespace. Private buckets need a storage integration ID.',
		idempotent: false,
	},
	props: {
		indexName: pineconeAiProps.indexName({ required: true }),
		uri: Property.ShortText({
			displayName: 'Storage URI',
			description:
				'Directory prefix to import, e.g. "s3://my-bucket/vectors/". Use s3:// for an aws index, gs:// for gcp, https:// for azure.',
			required: true,
		}),
		integrationId: Property.ShortText({
			displayName: 'Storage Integration ID',
			description:
				'ID of the storage integration set up in the Pinecone console, for private buckets.',
			required: false,
		}),
		errorMode: Property.StaticDropdown<'continue' | 'abort', false>({
			displayName: 'On Error',
			description: '"continue" skips bad records, "abort" stops the import. Defaults to continue.',
			required: false,
			options: {
				options: [
					{ label: 'Continue', value: 'continue' },
					{ label: 'Abort', value: 'abort' },
				],
			},
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const client = pineconeClient.create({ auth: context.auth });
		const index = client.index({ name: p.indexName });
		return await index.startImport({
			uri: p.uri,
			...(p.integrationId !== undefined ? { integration: p.integrationId } : {}),
			...(p.errorMode !== undefined ? { errorMode: p.errorMode } : {}),
		});
	},
});
