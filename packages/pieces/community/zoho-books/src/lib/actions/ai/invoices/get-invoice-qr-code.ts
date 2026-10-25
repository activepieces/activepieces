import { createAction } from '@activepieces/pieces-framework';

import { zohoBooksAuth } from '../../../auth';
import { zohoBooksAiProps } from '../../../common/ai-props';
import { zohoBooksApi } from '../../../common/api';
import { zohoBooksClient } from '../../../common/client';

export const getInvoiceQrCodeAction = createAction({
  auth: zohoBooksAuth,
  name: 'zoho_books_get_invoice_qr_code',
  displayName: 'Get Invoice QR Code',
  description: 'Gets the QR code generated for a Zoho Books invoice.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Gets the QR code image generated for an invoice and returns it as a file.',
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
    const file = await zohoBooksClient.download({
      auth: context.auth,
      path: `/invoices/${encodeURIComponent(context.propsValue.invoiceId)}/qrcode`,
      query: { organization_id: organizationId },
    });
    return {
      file: await context.files.write({
        fileName: file.fileName ?? 'invoice-qr-code.png',
        data: file.data,
      }),
      contentType: file.contentType,
    };
  },
});
