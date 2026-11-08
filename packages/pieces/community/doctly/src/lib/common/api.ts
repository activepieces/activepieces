import { HttpMethod } from '@activepieces/pieces-common';
import { doctlyClient } from './client';
import type { DoctlyAuthValue, DoctlyDocument } from './types';

async function getDocument({ auth, documentId }: { auth: DoctlyAuthValue; documentId: string }): Promise<DoctlyDocument> {
	return await doctlyClient.request<DoctlyDocument>({
		auth,
		method: HttpMethod.GET,
		path: `/documents/${documentId}`,
	});
}

export const doctlyApi = { getDocument };
