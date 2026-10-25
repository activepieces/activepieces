import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const trackContact1099Action = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_track_contact_1099',
  displayName: 'Track Contact 1099',
  description: 'Tracks a Zoho Books contact for 1099 reporting.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Turns on 1099 tracking for one vendor. Only for organizations in the US edition. Use Track Contacts 1099 for several contacts and Untrack Contact 1099 to stop.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/track1099`,
      query: { organization_id: organizationId },
    });
  },
});
