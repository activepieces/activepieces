import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const scheduleInvoiceEmailAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_schedule_invoice_email',
  displayName: 'Schedule Invoice Email',
  description: 'Schedules a Zoho Books invoice to be emailed to the customer later.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Schedules the invoice to be emailed to the customer at a future date and time; Cancel Scheduled Invoice Email cancels it. Use Email Invoice to send it now.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    scheduleTime: Property.ShortText({
      displayName: 'Schedule Time',
      description:
        'Date and time to send the email, as yyyy-mm-dd HH:MM:SS, e.g. "2026-11-20 10:00:00".',
      required: true,
    }),
    additionalFields: zohoBooksAiProps.additionalFields({
      description:
        'Other request body fields, sent as-is, e.g. {"to_mail_ids": ["billing@zylker.com"], "subject": "Invoice INV-00003", "body": "Please find the invoice attached."}. Schedule Time wins over the same key here.',
    }),
  },
  async run(context) {
    const { invoiceId, scheduleTime, additionalFields } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/email/schedule`,
      query: { organization_id: organizationId },
      body: { ...additionalFields, schedule_time: scheduleTime },
    });
  },
});
