import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { extractDataFromDocumentAction } from './lib/actions/extract-data-from-document';
import { uploadDocumentAction } from './lib/actions/upload-document-for-parsing';
import { extractDataWaitAction } from './lib/actions/parse-document-sync';
import { listInboxesAiAction } from './lib/actions/ai/list-inboxes';
import { getInboxAiAction } from './lib/actions/ai/get-inbox';
import { listDocumentsAiAction } from './lib/actions/ai/list-documents';
import { getDocumentAiAction } from './lib/actions/ai/get-document';
import { parseDocumentSyncAiAction } from './lib/actions/ai/parse-document-sync';
import { createInboxAiAction } from './lib/actions/ai/create-inbox';
import { upsertExtractionSchemaAiAction } from './lib/actions/ai/upsert-extraction-schema';
import { documentParsedTrigger } from './lib/triggers/document-parsed';
import { airparserAuth } from './lib/auth';
import { BASE_URL } from './lib/common';

export const airparser = createPiece({
	displayName: 'Airparser',
	description: 'Extract structured data from emails, PDFs, or documents with Airparser.',
	auth: airparserAuth,
	minimumSupportedRelease: '0.88.2',
	logoUrl: 'https://cdn.activepieces.com/pieces/airparser.png',
	authors: ['krushnarout', 'kishanprmr'],
	categories: [PieceCategory.PRODUCTIVITY],
	actions: [
		uploadDocumentAction,
		extractDataFromDocumentAction,
		extractDataWaitAction,
		listInboxesAiAction,
		getInboxAiAction,
		listDocumentsAiAction,
		getDocumentAiAction,
		parseDocumentSyncAiAction,
		createInboxAiAction,
		upsertExtractionSchemaAiAction,
		createCustomApiCallAction({
			auth: airparserAuth,
			baseUrl: () => BASE_URL,
			authMapping: async (auth) => ({
				'X-API-Key': typeof auth === 'object' && auth !== null && 'secret_text' in auth && typeof auth.secret_text === 'string' ? auth.secret_text : '',
			}),
		}),
	],
	triggers: [documentParsedTrigger],
});
