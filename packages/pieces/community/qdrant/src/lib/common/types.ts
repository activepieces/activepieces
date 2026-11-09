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

export type QdrantBody = Record<string, unknown>;

export type QdrantEnvelope<T> = { result: T; status?: string; time?: number };

export type QdrantUpdateResult = { operation_id?: number | null; status: string };

export type QdrantRecord = {
	id: QdrantPointId;
	payload?: Record<string, unknown> | null;
	vector?: unknown;
};

export type QdrantScoredPoint = QdrantRecord & { version?: number; score: number };

export type QdrantCollectionsList = { collections: { name: string }[] };

export type QdrantAliasesList = { aliases: { alias_name: string; collection_name: string }[] };

export type QdrantSnapshot = {
	name: string;
	creation_time?: string | null;
	size: number;
	checksum?: string | null;
};

export type QdrantScrollResult = {
	points: QdrantRecord[];
	next_page_offset?: QdrantPointId | null;
};

export type QdrantPointsSelector = { points: QdrantPointId[] } | { filter: QdrantBody };
