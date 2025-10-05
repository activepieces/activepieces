import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { createDocument } from './lib/actions/create-document';
import { createDocumentFromFile } from './lib/actions/create-document-from-file';
import { findDocument } from './lib/actions/find-document';
import { getParsedDocumentById } from './lib/actions/get-parsed-document-by-id';
import { reprocessDocument } from './lib/actions/reprocess-document';
import { parseurAuth, parseurCommon } from './lib/common';
import { newDocumentExportFailed } from './lib/triggers/new-document-export-failed';
import { newDocumentNotProcessed } from './lib/triggers/new-document-not-processed';
import { newDocumentProcessed } from './lib/triggers/new-document-processed';
import { newMailbox } from './lib/triggers/new-mailbox';
import { newTableFieldProcessed } from './lib/triggers/new-table-field-processed';

export const parseur = createPiece({
  displayName: 'Parseur',
  description:
    'Parseur is a document/email parsing tool that extracts structured data from emails, attachments, PDFs, invoices, forms, etc. It supports dynamic templates and table fields, and delivers parsed output to integrations (e.g. via webhook or API). This integration enables reactive workflows based on new processed documents, failed processing, mailbox changes, and more.',
  auth: parseurAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/parseur.png',
  authors: ['LuizDMM'],
  actions: [
    getParsedDocumentById,
    createDocument,
    createDocumentFromFile,
    reprocessDocument,
    findDocument,
    createCustomApiCallAction({
      auth: parseurAuth,
      baseUrl: () => parseurCommon.baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: auth as string,
        };
      },
    }),
  ],
  triggers: [
    newDocumentProcessed,
    newTableFieldProcessed,
    newDocumentNotProcessed,
    newDocumentExportFailed,
    newMailbox,
  ],
});
