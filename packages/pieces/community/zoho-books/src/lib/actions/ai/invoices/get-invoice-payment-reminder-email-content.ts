import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoicePaymentReminderEmailContentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_payment_reminder_email_content',
  displayName: 'Get Invoice Payment Reminder Email Content',
  description: 'Gets the payment reminder email content of an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Gets the default payment reminder email of an invoice (recipients, subject, body), to review or adapt before Send Invoice Payment Reminder.',
    idempotent: true,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
  },
  async run(context) {
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/paymentreminder`,
      query: { organization_id: organizationId },
    });
  },
});
