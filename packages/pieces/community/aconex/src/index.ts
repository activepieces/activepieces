import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { customApiCallAction } from './lib/actions/custom-api-call';
import { downloadDocumentFileAction } from './lib/actions/download-document-file';
import { getDocumentMetadataAction } from './lib/actions/get-document-metadata';
import { getMailAction } from './lib/actions/get-mail';
import { listDocumentsAction } from './lib/actions/list-documents';
import { listProjectMailAction } from './lib/actions/list-project-mail';
import { listProjectsAction } from './lib/actions/list-projects';
import { aconexAuth } from './lib/auth';
import { newOrUpdatedDocumentTrigger } from './lib/triggers/new-or-updated-document';
import { newOrUpdatedMailTrigger } from './lib/triggers/new-or-updated-mail';

export const aconex = createPiece({
  displayName: 'Aconex',
  description: 'Read Oracle Aconex projects, mail, and documents.',
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/aconex.png',
  categories: [PieceCategory.PRODUCTIVITY],
  auth: aconexAuth,
  authors: ['ReedME'],
  actions: [
    listProjectsAction,
    listProjectMailAction,
    getMailAction,
    listDocumentsAction,
    getDocumentMetadataAction,
    downloadDocumentFileAction,
    customApiCallAction,
  ],
  triggers: [newOrUpdatedMailTrigger, newOrUpdatedDocumentTrigger],
});
