import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const sendInvoicePaymentRemindersAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_send_invoice_payment_reminders',
  displayName: 'Send Invoice Payment Reminders',
  description: 'Emails payment reminders for several unpaid invoices in Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails a payment reminder with the default content for up to 10 invoices at once; only open or overdue invoices get one. Each call sends the reminders again. Use Send Invoice Payment Reminder to customize one reminder.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceIds: Property.Array({
      displayName: 'Invoice IDs',
      description: 'Up to 10 invoice IDs, from List Invoices.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceIds } = context.propsValue;
    const invoiceIdsList = zohoBooksUtils.toStringList({
      value: invoiceIds,
      propName: 'Invoice IDs',
    });
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/invoices/paymentreminder',
      query: { organization_id: organizationId, invoice_ids: invoiceIdsList.join(',') },
    });
  },
});
