import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactIncomeAndExpenseAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_income_and_expense',
  displayName: 'Get Contact Income And Expense',
  description: 'Gets the income and expense summary of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the income and expense totals recorded for a contact, as shown on its overview. For the profit and loss figures use Get Contact Profit And Loss.',
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
      path: `/contacts/${encodeURIComponent(context.propsValue.contactId)}/incomeandexpense`,
      query: { organization_id: organizationId },
    });
  },
});
