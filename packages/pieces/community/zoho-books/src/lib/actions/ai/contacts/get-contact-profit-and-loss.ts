import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactProfitAndLossAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_profit_and_loss',
  displayName: 'Get Contact Profit And Loss',
  description: 'Gets the profit and loss summary of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the profit and loss summary of a contact. For income and expense totals use Get Contact Income And Expense.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/profitandloss`,
      query: { organization_id: organizationId },
    });
  },
});
