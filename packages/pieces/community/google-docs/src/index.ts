import { createPiece } from '@activepieces/pieces-framework';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { createDocument } from './lib/actions/create-document';
import { createDocumentBasedOnTemplate } from './lib/actions/create-document-based-on-template.action';
import { readDocument } from './lib/actions/read-document.action';
import { appendText } from './lib/actions/append-text';
import { findDocumentAction } from './lib/actions/find-document';
import { findAndReplaceText } from './lib/actions/find-and-replace-text';
import { insertText } from './lib/actions/insert-text';
import { insertImage } from './lib/actions/insert-image';
import { replaceImage } from './lib/actions/replace-image';
import { copyDocument } from './lib/actions/copy-document';
import { shareDocument } from './lib/actions/share-document';
import { exportDocument } from './lib/actions/export-document';
import { newDocumentTrigger } from './lib/triggers/new-document';
import { updatedDocumentTrigger } from './lib/triggers/updated-document';
import { googleDocsAuth, getAccessToken, GoogleDocsAuthValue } from './lib/auth';

export { googleDocsAuth, getAccessToken, GoogleDocsAuthValue } from './lib/auth';

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
		'Kevinyu-alan',
	],
	auth: googleDocsAuth,
	actions: [
		createDocument,
		createDocumentBasedOnTemplate,
		copyDocument,
		readDocument,
		findDocumentAction,
		appendText,
		insertText,
		findAndReplaceText,
		insertImage,
		replaceImage,
		shareDocument,
		exportDocument,
		createCustomApiCallAction({
			baseUrl: () => 'https://docs.googleapis.com/v1',
			auth: googleDocsAuth,
			authMapping: async (auth) => ({
				Authorization: `Bearer ${await getAccessToken(auth as GoogleDocsAuthValue)}`,
			}),
		}),
	],
	triggers: [newDocumentTrigger, updatedDocumentTrigger],
});
