import type { AppConnectionType } from '@activepieces/pieces-framework';

import type { CreateIndexOptions } from '@pinecone-database/pinecone';

export type PineconeAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { apiKey: string };
};

export type PineconeCreateIndexSpec = CreateIndexOptions['spec'];

export type {
	CreateIndexOptions,
	PineconeRecord,
	QueryOptions,
	RecordMetadata,
	RecordSparseValues,
	UpdateOptions,
} from '@pinecone-database/pinecone';
