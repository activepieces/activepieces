import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const emailInvoiceAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_email_invoice',
  displayName: 'Email Invoice',
  description: 'Emails an invoice to the customer from Zoho Books.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Emails one invoice to the given recipients; subject and body default to the invoice email template (see Get Invoice Email Content). Each call sends another email. A draft invoice is marked as sent.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    toMailIds: Property.Array({
      displayName: 'To',
      description: 'Recipient email addresses, e.g. ["willsmith@bowmanfurniture.com"].',
      required: true,
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
    fromAddressId: Property.ShortText({
      displayName: 'From Address ID',
      description:
        'ID of a verified sender address in Zoho Books. Defaults to the organization sender.',
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
    sendAttachment: zohoBooksAiProps.flag({
      required: false,
      displayName: 'Attach Invoice Attachment',
      description: 'Yes to attach the file attached to the invoice.',
    }),
  },
  async run(context) {
    const {
      invoiceId,
      toMailIds,
      ccMailIds,
      subject,
      body,
      fromAddressId,
      sendFromOrgEmailId,
      sendCustomerStatement,
      sendAttachment,
    } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/email`,
      query: {
        organization_id: organizationId,
        send_customer_statement: sendCustomerStatement,
        send_attachment: sendAttachment,
      },
      body: {
        to_mail_ids: toMailIds,
        ...(ccMailIds && ccMailIds.length > 0 ? { cc_mail_ids: ccMailIds } : {}),
        ...spreadIfDefined('subject', subject),
        ...spreadIfDefined('body', body),
        ...spreadIfDefined('from_address_id', fromAddressId),
        ...spreadIfDefined(
          'send_from_org_email_id',
          zohoBooksUtils.toBoolean({ value: sendFromOrgEmailId }),
        ),
      },
    });
  },
});
