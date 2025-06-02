import { createPiece, PieceAuth, Property } from '@activepieces/pieces-framework';
import { createDocumentFromTemplate } from './lib/actions/create-document-from-template';
import { createAttachment } from './lib/actions/create-attachment';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { findDocument } from './lib/actions/find-document';
import { getDocumentAttachments } from './lib/actions/get-document-attachments';
import { getDocumentDetails } from './lib/actions/get-document-details';
import { downloadDocument } from './lib/actions/download-document';

export const pandadocAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'The API key for PandaDoc. You can generate this in your PandaDoc Developer Dashboard.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    // TODO: Implement validation by making a test API call
    return {
      valid: true,
    };
  },
});

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
    downloadDocument
  ],
  triggers: [],
});
