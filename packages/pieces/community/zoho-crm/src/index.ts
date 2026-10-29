import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { newContact } from './lib/triggers/new-contact';
import { newRecordTrigger } from './lib/triggers/new-record';
import { updatedRecordTrigger } from './lib/triggers/updated-record';
import { readFile } from './lib/actions/read-file';
import { createRecordAction } from './lib/actions/create-record';
import { updateRecordAction } from './lib/actions/update-record';
import { getRecordAction } from './lib/actions/get-record';
import { upsertRecordAction } from './lib/actions/upsert-record';
import { deleteRecordAction } from './lib/actions/delete-record';
import { convertLeadAction } from './lib/actions/convert-lead';
import { addNoteAction } from './lib/actions/add-note';
import { addTagsToRecordAction } from './lib/actions/add-tags-to-record';
import { uploadAttachmentAction } from './lib/actions/upload-attachment';
import { zohoAiActions } from './lib/actions/ai';
import { customApiAuthHeaders, getApiDomain, readField } from './lib/common/client';
import { zohoCrmAuth } from './lib/auth';

export const zohoCrm = createPiece({
  displayName: 'Zoho CRM',
  description: 'Customer relationship management software',

  logoUrl: 'https://cdn.activepieces.com/pieces/zoho-crm.png',
  minimumSupportedRelease: '0.88.2',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud","ikus060"],
  auth: zohoCrmAuth,
  actions: [
    readFile,
    createRecordAction,
    updateRecordAction,
    getRecordAction,
    upsertRecordAction,
    deleteRecordAction,
    convertLeadAction,
    addNoteAction,
    addTagsToRecordAction,
    uploadAttachmentAction,
    ...zohoAiActions,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        if (!auth) {
          return '';
        }
        try {
          return `${getApiDomain(auth)}/crm/v3`;
        } catch {
          return '';
        }
      },

      auth: zohoCrmAuth,
      authMapping: async (auth, propsValue) => customApiAuthHeaders({ auth, url: readField({ value: propsValue['url'], key: 'url' }) }),
    }),
  ],
  triggers: [newContact, newRecordTrigger, updatedRecordTrigger],
});
