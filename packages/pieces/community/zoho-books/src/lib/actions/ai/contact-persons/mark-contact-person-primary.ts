import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const markContactPersonPrimaryAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_mark_contact_person_primary',
  displayName: 'Mark Contact Person as Primary',
  description: 'Makes a contact person the primary contact person of its contact.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Makes a contact person the primary contact person of its contact; the previous primary person stays as a regular contact person.',
    idempotent: true,
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
      method: HttpMethod.POST,
      path: `/contacts/contactpersons/${encodeURIComponent(
        context.propsValue.contactPersonId,
      )}/primary`,
      query: { organization_id: organizationId },
    });
  },
});
