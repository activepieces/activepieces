import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const enableInvoicePaymentReminderAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_enable_invoice_payment_reminder',
  displayName: 'Enable Invoice Payment Reminder',
  description: 'Turns on automated payment reminders for an invoice in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Resumes automated payment reminders for one invoice after Disable Invoice Payment Reminder. To email a reminder now, use Send Invoice Payment Reminder.',
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
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/paymentreminder/enable`,
      query: { organization_id: organizationId },
    });
  },
});
