import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceEmailContentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_email_content',
  displayName: 'Get Invoice Email Content',
  description: 'Gets the email content of an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the email Zoho Books would send for an invoice (recipients, subject, body, sender and email templates), to review or adapt before Email Invoice.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    emailTemplateId: Property.ShortText({
      displayName: 'Email Template ID',
      description:
        "Email template to render, from the emailtemplates in this action's response. Defaults to the template of the customer, then the default one.",
      required: false,
    }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/email`,
      query: {
        organization_id: organizationId,
        email_template_id: context.propsValue.emailTemplateId,
      },
    });
  },
});
