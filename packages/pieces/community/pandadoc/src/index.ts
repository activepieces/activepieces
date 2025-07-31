import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

import { createDocumentFromTemplate } from './lib/actions/create-document-from-template';
import { createAttachment } from './lib/actions/create-attachment';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { findDocument } from './lib/actions/find-document';
import { getDocumentAttachments } from './lib/actions/get-document-attachments';
import { getDocumentDetails } from './lib/actions/get-document-details';
import { downloadDocument } from './lib/actions/download-document';

import { documentCompleted } from './lib/triggers/document-completed';
import { documentStateChanged } from './lib/triggers/document-state-changed';
import { documentUpdated } from './lib/triggers/document-updated';

import { pandadocAuth } from './lib/common';
import { PieceCategory } from '@activepieces/shared';

export const pandadoc = createPiece({
  displayName: 'PandaDoc',
  auth: pandadocAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/pandadoc.png',
  categories:[PieceCategory.CONTENT_AND_FILES,PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david'],
  actions: [
    createDocumentFromTemplate,
    createAttachment,
    createOrUpdateContact,
    findDocument,
    getDocumentAttachments,
    getDocumentDetails,
    downloadDocument,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pandadoc.com/public/v1',
      auth: pandadocAuth,
      authMapping: async (auth) => ({
        Authorization: `API-Key ${(auth as string)}`,
      }),
    }),
  ],
  triggers: [
    documentCompleted,
    documentStateChanged,
    documentUpdated,
  ],
});
