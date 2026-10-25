import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactOpeningBalancesAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_opening_balances',
  displayName: 'Get Contact Opening Balances',
  description: 'Gets the opening balances of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the opening balances recorded for a contact, such as the receivable or payable balance it started with.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/openingbalances`,
      query: { organization_id: organizationId },
    });
  },
});
