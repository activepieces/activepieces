import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { pdfmonkeyAuth } from './lib/common/auth';
import { BASE_URL } from './lib/common/client';
import { generateDocumentAction } from './lib/actions/generate-document';
import { generateDocumentAiAction } from './lib/actions/generate-document-ai';
import { findDocumentAction } from './lib/actions/find-document';
import { getDocumentAiAction } from './lib/actions/get-document-ai';
import { listDocumentsAction } from './lib/actions/list-documents';
import { updateDocumentAction } from './lib/actions/update-document';
import { downloadDocumentAction } from './lib/actions/download-document';
import { deleteDocumentAction } from './lib/actions/delete-document';
import { deleteDocumentAiAction } from './lib/actions/delete-document-ai';
import { listTemplatesAction } from './lib/actions/list-templates';
import { getTemplateAction } from './lib/actions/get-template';
import { getCurrentUserAction } from './lib/actions/get-current-user';
import { documentGeneratedTrigger } from './lib/triggers/document-generated';

export const pdfmonkey = createPiece({
  displayName: 'PDFMonkey',
  description: 'Generate PDF documents from templates and JSON data.',
  auth: pdfmonkeyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pdfmonkey.png',
  authors: ['Sanket6652'],
  categories: [PieceCategory.CONTENT_AND_FILES],
  actions: [
    generateDocumentAction,
    generateDocumentAiAction,
    findDocumentAction,
    getDocumentAiAction,
    listDocumentsAction,
    updateDocumentAction,
    downloadDocumentAction,
    deleteDocumentAction,
    deleteDocumentAiAction,
    listTemplatesAction,
    getTemplateAction,
    getCurrentUserAction,
    createCustomApiCallAction({
      auth: pdfmonkeyAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [documentGeneratedTrigger],
});
