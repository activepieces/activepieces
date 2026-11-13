import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroEmailInvoiceAi = createAction({
  auth: xeroAuth,
  name: 'xero_email_invoice_ai',
  classification: 'WRITE',
  displayName: 'Email Invoice',
  description: 'Emails a sales invoice to its contact through Xero.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Emails a SUBMITTED, AUTHORISED or PAID sales invoice (ACCREC) to its contact\'s email address through Xero, using the organisation\'s email template; the contact must have an email address. Not idempotent: each call sends another email.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.invoiceEmail,
  props: {
    tenant_id: aiProps.tenantId(),
    invoice_id: aiProps.id({ displayName: 'Invoice ID', description: 'Xero InvoiceID (a GUID) of the sales invoice to email.' }),
  },
  async run(context) {
    const invoiceId = xeroInput.requiredText({ value: context.propsValue.invoice_id, field: 'Invoice ID' });
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: context.propsValue.tenant_id });
    await xeroApi.request<unknown>({
      accessToken,
      tenantId,
      method: HttpMethod.POST,
      url: `${XERO_URLS.api}/Invoices/${encodeURIComponent(invoiceId)}/Email`,
      body: {},
      operation: 'email invoice',
    });
    return { success: true, invoiceId };
  },
});
