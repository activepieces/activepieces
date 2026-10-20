import { Pinecone } from '@pinecone-database/pinecone';

import type { PineconeAuthValue } from './types';

function create({ auth }: { auth: PineconeAuthValue }): Pinecone {
	if (!auth.props || !auth.props.apiKey) {
		throw new Error('Invalid authentication: API key is required');
	}
	return new Pinecone({ apiKey: auth.props.apiKey });
}

export const pineconeClient = { create };
