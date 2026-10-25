import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactUnusedCreditsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_unused_credits',
  displayName: 'Get Contact Unused Credits',
  description: 'Gets the unused credits of a Zoho Books customer.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the credits of a customer that are not yet applied, such as open credit notes and excess payments, with their IDs and balances. For unused retainer payments use Get Contact Unused Retainer Payments.',
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
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(
        context.propsValue.contactId,
      )}/receivables/unusedcredits`,
      query: { organization_id: organizationId },
    });
  },
});
