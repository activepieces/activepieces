import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { createDocumentFromTemplate } from './lib/actions/create-document-from-template';
import { createAttachment } from './lib/actions/create-attachment';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { findDocument } from './lib/actions/find-document';
import { getDocumentAttachments } from './lib/actions/get-document-attachments';
import { getDocumentDetails } from './lib/actions/get-document-details';
import { downloadDocument } from './lib/actions/download-document';
import { pandadocAuth } from './lib/common/auth';
import { documentCompleted } from './lib/triggers/document-completed';
import { documentStateChanged } from './lib/triggers/document-state-changed-';
import { documentUpdated } from './lib/triggers/document-updated';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const pandadoc = createPiece({
  displayName: 'Pandadoc',
  auth: pandadocAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pandadoc.png',
  authors: [],
  actions: [
    createDocumentFromTemplate,
    createAttachment,
    createOrUpdateContact,
    findDocument,
    getDocumentAttachments,
    getDocumentDetails,
    downloadDocument,
  ],
  triggers: [documentCompleted, documentStateChanged, documentUpdated],
});
