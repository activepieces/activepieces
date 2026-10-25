import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const markContactInactiveAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_contact_inactive',
  displayName: 'Mark Contact Inactive',
  description: 'Marks a Zoho Books contact as inactive.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks a customer or vendor as inactive so it is hidden from new transactions while its history is kept. Use Mark Contact Active to reverse it; prefer this over Delete Contact.',
    idempotent: true,
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
      method: HttpMethod.POST,
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/inactive`,
      query: { organization_id: organizationId },
    });
  },
});
