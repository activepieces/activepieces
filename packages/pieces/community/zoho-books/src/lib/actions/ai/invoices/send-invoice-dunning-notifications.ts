import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const sendInvoiceDunningNotificationsAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_send_invoice_dunning_notifications',
  displayName: 'Send Invoice Dunning Notifications',
  description: 'Sends dunning notifications to the customer of an overdue Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sends the configured dunning notifications for an overdue invoice to its customer. Each call sends again; use Send Invoice Payment Reminder for a single reminder email. Needs payment reminders configured in Zoho Books.',
    idempotent: false,
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
      path: `/invoices/${encodeURIComponent(
        context.propsValue.invoiceId,
      )}/senddunningnotifications`,
      query: { organization_id: organizationId },
    });
  },
});
