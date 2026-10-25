import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction, spreadIfDefined } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';
import { zohoBooksUtils } from '../../../common/utils';

export const addInvoiceCommentAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_add_invoice_comment',
  displayName: 'Add Invoice Comment',
  description: 'Adds a comment to a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a comment to an invoice and returns it with its comment_id. Each call adds a new comment; check List Invoice Comments first to avoid duplicates.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    description: Property.LongText({
      displayName: 'Comment',
      description: 'Text of the comment.',
      required: true,
    }),
    paymentExpectedDate: Property.ShortText({
      displayName: 'Payment Expected Date',
      description: 'Date the payment is expected, as yyyy-mm-dd, e.g. "2026-11-30".',
      required: false,
    }),
    showCommentToClients: zohoBooksAiProps.flag({
      displayName: 'Show Comment To Clients',
      description: 'Whether the customer sees the comment in the customer portal.',
      required: false,
    }),
  },
  async run(context) {
    const { invoiceId, description, paymentExpectedDate, showCommentToClients } =
      context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/comments`,
      query: { organization_id: organizationId },
      body: {
        description,
        ...spreadIfDefined('payment_expected_date', paymentExpectedDate),
        ...spreadIfDefined(
          'show_comment_to_clients',
          zohoBooksUtils.toBoolean({ value: showCommentToClients }),
        ),
      },
    });
  },
});
