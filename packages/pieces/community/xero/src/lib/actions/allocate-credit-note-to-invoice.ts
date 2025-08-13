import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import {
  creditNoteIdDropdown,
  invoiceIdDropdown,
  props,
} from '../common/props';

export const allocateCreditNoteToInvoice = createAction({
  auth: xeroAuth,
  name: 'allocateCreditNoteToInvoice',
  displayName: 'Allocate Credit Note to Invoice',
  description:
    'Allocates a credit note to a specific invoice by creating an allocation',
  props: {
    tenant_id: props.tenant_id,
    creditNoteID: creditNoteIdDropdown,
    invoiceID: invoiceIdDropdown,
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount to allocate from the credit note to the invoice',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    if (propsValue.amount <= 0) {
      throw new Error('Amount must be greater than zero');
    }

    const allocationData = {
      Amount: propsValue.amount,
      Invoice: {
        InvoiceID: propsValue.invoiceID,
      },
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      `/CreditNotes/${propsValue.creditNoteID}/Allocations`,
      allocationData,
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return {
      success: true,
      allocation: response.Allocations?.[0],
      creditNote: response.CreditNotes?.[0],
      message: `Credit note allocated successfully`,
    };
  },
});
