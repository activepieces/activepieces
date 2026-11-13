import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { pandadocAuth } from './lib/common/auth';
import { createDocumentFromTemplate } from './lib/actions/create-document-from-template';
import { createAttachment } from './lib/actions/create-attachment';
import { createOrUpdateContact } from './lib/actions/create-or-update-contact';
import { findDocument } from './lib/actions/find-document';
import { getDocumentAttachments } from './lib/actions/get-document-attachments';
import { getDocumentDetails } from './lib/actions/get-document-details';
import { downloadDocument } from './lib/actions/download-document';
import { sendDocument } from './lib/actions/send-document';
import { createDocumentFromFile } from './lib/actions/create-document-from-file';
import { createSigningLink } from './lib/actions/create-signing-link';
import { sendDocumentReminder } from './lib/actions/send-document-reminder';
import { updateDocumentStatus } from './lib/actions/update-document-status';
import { deleteDocument } from './lib/actions/delete-document';
import { moveDocumentToFolder } from './lib/actions/move-document-to-folder';
import { addDocumentRecipient } from './lib/actions/add-document-recipient';
import { listDocumentFields } from './lib/actions/list-document-fields';
import { listTemplates } from './lib/actions/list-templates';
import { getTemplateDetails } from './lib/actions/get-template-details';
import { listDocumentFolders } from './lib/actions/list-document-folders';
import { createDocumentFolder } from './lib/actions/create-document-folder';
import { findContacts } from './lib/actions/find-contacts';
import { deleteContact } from './lib/actions/delete-contact';
import { createDocumentFromTemplateAi } from './lib/actions/ai/create-document-from-template';
import { addDocumentAttachmentAi } from './lib/actions/ai/add-document-attachment';
import { createContactAi } from './lib/actions/ai/create-contact';
import { updateContactAi } from './lib/actions/ai/update-contact';
import { downloadDocumentAi } from './lib/actions/ai/download-document';
import { searchDocumentsAi } from './lib/actions/ai/search-documents';
import { listDocumentAttachmentsAi } from './lib/actions/ai/list-document-attachments';
import { getDocumentAi } from './lib/actions/ai/get-document';
import { documentCompleted } from './lib/triggers/document-completed';
import { documentStateChanged } from './lib/triggers/document-state-changed';
import { documentUpdated } from './lib/triggers/document-updated';
import { recipientCompleted } from './lib/triggers/recipient-completed';
import { documentDeleted } from './lib/triggers/document-deleted';
import { documentCreationFailed } from './lib/triggers/document-creation-failed';

export const pandadoc = createPiece({
  displayName: 'PandaDoc',
  description: 'Create, send and track documents, proposals and e-signatures.',
  auth: pandadocAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/pandadoc.png',
  categories: [PieceCategory.CONTENT_AND_FILES, PieceCategory.PRODUCTIVITY],
  authors: ['onyedikachi-david', 'OdaiAhmed99'],
  actions: [
    createDocumentFromTemplate,
    createAttachment,
    createOrUpdateContact,
    findDocument,
    getDocumentAttachments,
    getDocumentDetails,
    downloadDocument,
    sendDocument,
    createDocumentFromFile,
    createSigningLink,
    sendDocumentReminder,
    updateDocumentStatus,
    deleteDocument,
    moveDocumentToFolder,
    addDocumentRecipient,
    listDocumentFields,
    listTemplates,
    getTemplateDetails,
    listDocumentFolders,
    createDocumentFolder,
    findContacts,
    deleteContact,
    createDocumentFromTemplateAi,
    addDocumentAttachmentAi,
    createContactAi,
    updateContactAi,
    downloadDocumentAi,
    searchDocumentsAi,
    listDocumentAttachmentsAi,
    getDocumentAi,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.pandadoc.com/public/v1',
      auth: pandadocAuth,
      authMapping: async (auth) => ({
        Authorization: `API-Key ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [documentCompleted, documentStateChanged, documentUpdated, recipientCompleted, documentDeleted, documentCreationFailed],
});
