import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getContactVendorStatementEmailContentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_contact_vendor_statement_email_content',
  displayName: 'Get Contact Vendor Statement Email Content',
  description: 'Gets the vendor statement email content for a Zoho Books vendor.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the default recipients, subject and body of the statement email for a vendor, to check or edit before sending it with Send Contact Vendor Statement Email. For customer statements use Get Contact Statement Email Content.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    contactId: zohoBooksAiProps.contactId({
      required: true,
      displayName: 'Vendor ID',
      description: 'Contact ID of a vendor, from List Contacts or Create Contact.',
    }),
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
      path: `/contacts/${encodeURIComponent(contactId)}/vendorstatements/email`,
      query: { organization_id: organizationId, start_date: startDate, end_date: endDate },
    });
  },
});
