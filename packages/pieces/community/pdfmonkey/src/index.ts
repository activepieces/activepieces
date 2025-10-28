import { createPiece } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from './lib/common/auth';
import { generateDocumentAction } from './lib/actions/generate-document';
import { deleteDocumentAction } from './lib/actions/delete-document';
import { findDocumentAction } from './lib/actions/find-document';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';
import { documentGeneratedTrigger } from './lib/triggers/document-generated';

export const pdfmonkey = createPiece({
	displayName: 'PDFMonkey',
	auth: pdfmonkeyAuth,
	minimumSupportedRelease: '0.36.1',
	logoUrl: 'https://cdn.activepieces.com/pieces/pdfmonkey.png',
	authors: ['Sanket6652'],
	categories: [PieceCategory.CONTENT_AND_FILES],
	actions: [
		generateDocumentAction,
		deleteDocumentAction,
		findDocumentAction,
		createCustomApiCallAction({
			auth: pdfmonkeyAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => {
				return {
					Authorization: `Bearer ${auth}`,
				};
			},
		}),
	],
	triggers: [documentGeneratedTrigger],
});
