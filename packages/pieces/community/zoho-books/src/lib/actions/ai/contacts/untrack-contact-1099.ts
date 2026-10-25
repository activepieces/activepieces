import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const untrackContact1099Action = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_untrack_contact_1099',
  displayName: 'Untrack Contact 1099',
  description: 'Stops tracking a Zoho Books contact for 1099 reporting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns off 1099 tracking for one vendor. Only for organizations in the US edition. Use Track Contact 1099 to turn it back on.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/untrack1099`,
      query: { organization_id: organizationId },
    });
  },
});
