import type { AppConnectionType } from '@activepieces/pieces-framework';

import type { Schemas } from '@qdrant/js-client-rest';

export type QdrantAuthValue = {
	type: AppConnectionType.CUSTOM_AUTH;
	props: { serverAddress: string; key: string };
};

export type QdrantDistance = 'Cosine' | 'Euclid' | 'Dot';

export type QdrantEmbedding = string | number[];

export type QdrantEmbeddingsInput = string | (number | QdrantEmbedding)[];

export type QdrantPointId = Schemas['ExtendedPointId'];

export type QdrantCondition = Schemas['Condition'];

export type QdrantFilter = {
	must: QdrantCondition[];
	must_not: QdrantCondition[];
};
