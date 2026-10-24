import { QdrantClient } from '@qdrant/js-client-rest';

import type { QdrantAuthValue } from './types';

function create({ auth }: { auth: QdrantAuthValue }): QdrantClient {
	return new QdrantClient({
		apiKey: auth.props.key,
		url: auth.props.serverAddress,
	});
}

export const qdrantClient = { create };
