import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';

import { processDocumentAction } from './lib/actions/process-document';
import { googleDocumentAiAuth } from './lib/auth';
import { googleDocumentAiClient } from './lib/common/client';

export const googleDocumentAi = createPiece({
	displayName: 'Google Document AI',
	description:
		'Extract text, entities, form fields and tables from documents with Google Document AI processors.',
	auth: googleDocumentAiAuth,
	minimumSupportedRelease: '0.88.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-document-ai.png',
	categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
	authors: ['fabio-kozlowski'],
	actions: [
		processDocumentAction,
		createCustomApiCallAction({
			auth: googleDocumentAiAuth,
			baseUrl: (auth) => googleDocumentAiClient.baseUrl({ auth }),
			description:
				"Call any Document AI endpoint. Paths start with the version, for example `/v1/projects/{project}/locations/{location}/processors`.",
			authMapping: async (auth, propsValue) =>
				await googleDocumentAiClient.authHeaders({ auth, url: requestedUrl(propsValue) }),
		}),
	],
	triggers: [],
});

function requestedUrl(propsValue: Record<string, unknown>): string {
	const urlProp = propsValue['url'];
	const url =
		typeof urlProp === 'object' && urlProp !== null && 'url' in urlProp ? urlProp.url : undefined;
	return typeof url === 'string' ? url : '';
}
