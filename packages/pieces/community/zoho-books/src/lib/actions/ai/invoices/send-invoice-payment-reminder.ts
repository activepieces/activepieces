import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const sendInvoicePaymentReminderAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_send_invoice_payment_reminder',
  displayName: 'Send Invoice Payment Reminder',
  description: 'Emails a payment reminder for an unpaid invoice from Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails a payment reminder for one open or overdue invoice; recipients, subject and body default to the reminder template (see Get Invoice Payment Reminder Email Content). Each call sends another email. Use Send Invoice Payment Reminders for several invoices.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    toMailIds: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses, e.g. ["willsmith@bowmanfurniture.com"].',
      required: false,
    }),
    ccMailIds: Property.Array({
      displayName: 'CC',
      description: 'Email addresses to copy.',
      required: false,
    }),
    subject: Property.ShortText({ displayName: 'Subject', required: false }),
    body: Property.LongText({
      displayName: 'Body',
      description: 'Email body; HTML is allowed.',
      required: false,
    }),
    sendFromOrgEmailId: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Send From Organization Email',
      description: 'Yes to send from the organization email address.',
    }),
    sendCustomerStatement: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Attach Customer Statement',
      description: 'Yes to attach the customer statement PDF.',
    }),
  },
  async run(context) {
    const {
      invoiceId,
      toMailIds,
      ccMailIds,
      subject,
      body,
      sendFromOrgEmailId,
      sendCustomerStatement,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/paymentreminder`,
      query: { organization_id: organizationId, send_customer_statement: sendCustomerStatement },
      body: {
        ...(toMailIds && toMailIds.length > 0 ? { to_mail_ids: toMailIds } : {}),
        ...(ccMailIds && ccMailIds.length > 0 ? { cc_mail_ids: ccMailIds } : {}),
        ...spreadIfDefined('subject', subject),
        ...spreadIfDefined('body', body),
        ...spreadIfDefined(
          'send_from_org_email_id',
          zohoBooksUtils.toBoolean({ value: sendFromOrgEmailId }),
        ),
      },
    });
  },
});
