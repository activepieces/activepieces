import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteContactAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contact',
  displayName: 'Delete Contact',
  description: 'Deletes a Zoho Books contact (customer or vendor).',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one customer or vendor. It cannot be undone; use Mark Contact Inactive to keep the history instead, or Delete Contacts for several at once.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}`,
      query: { organization_id: organizationId },
    });
  },
});
