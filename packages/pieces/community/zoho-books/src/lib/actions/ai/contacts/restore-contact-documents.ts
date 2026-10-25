import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const restoreContactDocumentsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_restore_contact_documents',
  displayName: 'Restore Contact Documents',
  description: 'Restores deleted documents of Zoho Books contacts.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores contact documents removed with Delete Contact Document, by their document IDs. Restoring a document that is already restored changes nothing.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    documentIds: Property.Array({
      displayName: 'Document IDs',
      description: 'IDs of the deleted documents, as given to Delete Contact Document.',
      required: true,
    }),
  },
  async run(context) {
    const { documentIds } = context.propsValue;
    const documentIdsList = zohoBooksUtils.toStringList({
      value: documentIds,
      propName: 'Document IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/contacts/documents/restore',
      query: { organization_id: organizationId, document_ids: documentIdsList.join(',') },
    });
  },
});
