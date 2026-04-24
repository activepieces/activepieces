import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall } from '../common/client';
import { wafeqProps } from '../common/props';

export const reportInvoiceToTaxAuthority = createAction({
  auth: wafeqAuth,
  name: 'report_invoice_to_tax_authority',
  displayName: 'Report Invoice to Tax Authority',
  description:
    'Submit an invoice to the tax authority (ZATCA in Saudi Arabia, FTA in UAE). The invoice must already be finalized in Wafeq before you can report it.',
  props: {
    invoice: wafeqProps.invoiceDropdown({
      description:
        'Pick which invoice to submit. ⚠️ The invoice must be in "Finalized" status first — if you just created it as a Draft, change its status to Finalized in Wafeq before running this action.',
    }),
    idempotency_key: wafeqProps.idempotencyKey,
  },
  async run(context) {
    const { invoice, idempotency_key } = context.propsValue;
    const response = await wafeqApiCall<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/invoices/${invoice}/tax-authority/report/`,
      idempotencyKey: idempotency_key as string | undefined,
    });
    return {
      invoice_id: invoice,
      status: 'submitted',
      response: response.body,
    };
  },
});
