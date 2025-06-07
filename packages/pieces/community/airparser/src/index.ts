import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { extractDataFromDocumentAction } from './lib/actions/extract-data-from-document';
import { uploadDocumentAction } from './lib/actions/upload-document-for-parsing';
import { documentParsedTrigger } from './lib/triggers/document-parsed';

export const airparserAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can find your API key in the Airparser dashboard under Account Settings.',
});

export const airparser = createPiece({
  displayName: 'Airparser',
  description: 'Extract structured data from emails, PDFs, or documents with Airparser.',
  auth: airparserAuth,
  logoUrl: 'https://cdn.activepieces.com/pieces/airparser.png',
  authors: ['krushnarout'],
  categories: [PieceCategory.PRODUCTIVITY],
  actions: [extractDataFromDocumentAction, uploadDocumentAction],
  triggers: [documentParsedTrigger],
});
