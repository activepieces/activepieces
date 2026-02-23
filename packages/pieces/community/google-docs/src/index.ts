import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createDocument } from './lib/actions/create-document';
import { createDocumentBasedOnTemplate } from './lib/actions/create-document-based-on-template.action';
import { readDocument } from './lib/actions/read-document.action';
import { appendText } from './lib/actions/append-text';
import { findDocumentAction } from './lib/actions/find-document';
import { newDocumentTrigger } from './lib/triggers/new-document';
import { googleDocsAuth, getAccessToken } from './lib/common';

export { googleDocsAuth, getAccessToken, GoogleDocsAuthValue } from './lib/common';

export const googleDocs = createPiece({
	displayName: 'Google Docs',
	description: 'Create and edit documents online',
	minimumSupportedRelease: '0.30.0',
	logoUrl: 'https://cdn.activepieces.com/pieces/google-docs.png',
	categories: [PieceCategory.CONTENT_AND_FILES],
	authors: [
		'pfernandez98',
		'kishanprmr',
		'MoShizzle',
		'khaledmashaly',
		'abuaboud',
		'AbdullahBitar',
		'Kevinyu-alan'
	],
	auth: googleDocsAuth,
	actions: [
		createDocument,
		createDocumentBasedOnTemplate,
		readDocument,
		findDocumentAction,
		createCustomApiCallAction({
			baseUrl: () => 'https://docs.googleapis.com/v1',
			auth: googleDocsAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${await getAccessToken(auth as any)}`,
			}),
		}),
		appendText,
	],
	triggers: [newDocumentTrigger],
});
