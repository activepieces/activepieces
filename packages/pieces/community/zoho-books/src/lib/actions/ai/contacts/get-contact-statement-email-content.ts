import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactStatementEmailContentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_statement_email_content',
  displayName: 'Get Contact Statement Email Content',
  description: 'Gets the default email content for sending a statement to a Zoho Books contact.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the default recipients, subject and body Zoho Books would use to email a contact statement for a date range (the current month when no dates are given), to reuse in Email Contact Statement. Nothing is sent.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({ required: true }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description:
        'Statement start date, yyyy-mm-dd. Without both dates the current month is used.',
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
      path: `/contacts/${encodeURIComponent(contactId)}/statements/email`,
      query: { organization_id: organizationId, start_date: startDate, end_date: endDate },
    });
  },
});
