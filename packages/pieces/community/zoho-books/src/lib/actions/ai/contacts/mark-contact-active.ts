import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const markContactActiveAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_contact_active',
  displayName: 'Mark Contact Active',
  description: 'Marks a Zoho Books contact as active.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks an inactive customer or vendor as active again so it can be used on new transactions. Use Mark Contact Inactive to reverse it.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/active`,
      query: { organization_id: organizationId },
    });
  },
});
