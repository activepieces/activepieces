import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const createInvoicePaymentLinkAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_create_invoice_payment_link',
  displayName: 'Create Invoice Payment Link',
  description: 'Generates a payment link for a Zoho Books invoice.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Generates a shareable payment link for an invoice that expires on the given date. Each call generates a new link. Needs an online payment gateway connected in Zoho Books.',
    idempotent: false,
  },
  props: {
    organizationId: zohoBooksAiProps.organizationId(),
    invoiceId: zohoBooksAiProps.invoiceId({ required: true }),
    linkType: Property.StaticDropdown({
      displayName: 'Link Type',
      description: 'Whether the link is public or private.',
      required: true,
      options: {
        options: [
          { label: 'Public', value: 'public' },
          { label: 'Private', value: 'private' },
        ],
      },
    }),
    expiryTime: Property.ShortText({
      displayName: 'Expiry Date',
      description: 'Date the link expires, as yyyy-MM-dd, e.g. "2026-12-31".',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId, linkType, expiryTime } = context.propsValue;
    const organizationId = await zohoBooksApi.resolveOrganizationId({
      auth: context.auth,
      organizationId: context.propsValue.organizationId,
    });
    return await zohoBooksClient.request({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/share/paymentlink',
      query: {
        organization_id: organizationId,
        transaction_id: invoiceId,
        transaction_type: 'invoice',
        link_type: linkType,
        expiry_time: expiryTime,
      },
    });
  },
});
