import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { parseurAiActions } from './lib/actions/ai';
import { createDocumentAction } from './lib/actions/create-document';
import { createDocumentFromFileAction } from './lib/actions/create-document-from-file';
import { findDocumentAction } from './lib/actions/find-document';
import { getParsedDocumentByIdAction } from './lib/actions/get-parsed-document-by-id';
import { reprocessDocumentAction } from './lib/actions/reprocess-document';
import { parseurAuth } from './lib/auth';
import { parseurClient } from './lib/common/client';
import { newDocumentExportFailedTrigger } from './lib/triggers/new-document-export-failed';
import { newDocumentNotProcessedTrigger } from './lib/triggers/new-document-not-processed';
import { newDocumentProcessedTrigger } from './lib/triggers/new-document-processed';
import { newMailboxTrigger } from './lib/triggers/new-mailbox';
import { newTableFieldProcessedTrigger } from './lib/triggers/new-table-field-processed';

export const parseur = createPiece({
  displayName: 'Parseur',
  description:
    'Parseur is a document/email parsing tool that extracts structured data from emails, attachments, PDFs, invoices, forms, etc. It supports dynamic templates and table fields, and delivers parsed output to integrations (e.g. via webhook or API). This integration enables reactive workflows based on new processed documents, failed processing, mailbox changes, and more.',
  auth: parseurAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/parseur.png',
  authors: ['LuizDMM'],
  actions: [
    getParsedDocumentByIdAction,
    createDocumentAction,
    createDocumentFromFileAction,
    reprocessDocumentAction,
    findDocumentAction,
    ...parseurAiActions,
    createCustomApiCallAction({
      auth: parseurAuth,
      baseUrl: () => parseurClient.baseUrl(),
      authMapping: async (auth) => {
        return {
          Authorization: auth.secret_text,
        };
      },
    }),
  ],
  triggers: [
    newDocumentProcessedTrigger,
    newTableFieldProcessedTrigger,
    newDocumentNotProcessedTrigger,
    newDocumentExportFailedTrigger,
    newMailboxTrigger,
  ],
});
