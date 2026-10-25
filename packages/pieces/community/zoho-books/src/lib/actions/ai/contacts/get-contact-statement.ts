import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactStatementAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_statement',
  displayName: 'Get Contact Statement',
  description: 'Gets the statement of account of a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the statement of account of a contact (its transactions and balances) for a date range. To email the statement use Email Contact Statement.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description:
        'Statement start date, yyyy-mm-dd. Leave Start Date and End Date empty for the current month.',
      required: false,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'Statement end date, yyyy-mm-dd.',
      required: false,
    }),
  },
  async run(context) {
    const { contactId, startDate, endDate } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/contacts/${encodeURIComponent(contactId)}/statements`,
      query: { organization_id: organizationId, start_date: startDate, end_date: endDate },
    });
  },
});
