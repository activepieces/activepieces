import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractDataFromDocumentAction } from './lib/actions/extract-data-from-document';
import { uploadDocumentAction } from './lib/actions/upload-document-for-parsing';
import { airparserApiCall } from './lib/common';
import { documentParsedTrigger } from './lib/triggers/document-parsed';

export const airparserAuth = PieceAuth.SecretText({
	displayName: 'API Key',
	required: true,
	description: 'You can find your API key in the Airparser dashboard under Account Settings.',
	validate: async ({ auth }) => {
		try {
			await airparserApiCall({
				apiKey: auth as string,
				method: HttpMethod.GET,
				resourceUri: '/inboxes',
			});

			return {
				valid: true,
			};
		} catch {
			return {
				valid: false,
				error: 'Invalid API key.',
			};
		}
	},
});

export const airparser = createPiece({
	displayName: 'Airparser',
	description: 'Extract structured data from emails, PDFs, or documents with Airparser.',
	auth: airparserAuth,
	logoUrl: 'https://cdn.activepieces.com/pieces/airparser.png',
	authors: ['krushnarout','kishanprmr'],
	categories: [PieceCategory.PRODUCTIVITY],
	actions: [extractDataFromDocumentAction, uploadDocumentAction],
	triggers: [documentParsedTrigger],
});
