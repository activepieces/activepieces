import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const deleteContactPersonAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_delete_contact_person',
  displayName: 'Delete Contact Person',
  description: 'Deletes a contact person of a Zoho Books customer or vendor.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes a contact person. It cannot be undone; the contact itself is kept.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactPersonId: zohoBooksAiProps.contactPersonId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/contacts/contactpersons/${encodeURIComponent(context.propsValue.contactPersonId)}`,
      query: { organization_id: organizationId },
    });
  },
});
