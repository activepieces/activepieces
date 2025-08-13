import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createCreditNote = createAction({
  auth: xeroAuth,
  name: 'createCreditNote',
  displayName: 'Create Credit Note',
  description: 'Creates a new credit note for a contact in Xero',
  props: {
    tenant_id: props.tenant_id, // Tenant dropdown to select the organization
    contact_id: props.contact_id(true), // Contact ID is required
    date: Property.ShortText({
      displayName: 'Date',
      description:
        'The date of the credit note (YYYY-MM-DD format). Defaults to today if not provided.',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for the credit note',
      required: true,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the line item',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Quantity of the item',
          required: true,
        }),
        unitAmount: Property.Number({
          displayName: 'Unit Amount',
          description: 'Unit price of the item',
          required: true,
        }),
        accountCode: Property.ShortText({
          displayName: 'Account Code',
          description: 'The account code for the line item',
          required: false,
        }),
        taxType: Property.ShortText({
          displayName: 'Tax Type',
          description: 'The tax type for the line item',
          required: false,
        }),
      },
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional reference for the credit note',
      required: false,
    }),
    type: Property.StaticDropdown({
      displayName: 'Credit Note Type',
      description: 'The type of the credit note (ACCRECCREDIT or ACCPAYCREDIT)',
      required: true,
      options: {
        options: [
          { label: 'Accounts Receivable Credit', value: 'ACCRECCREDIT' },
          { label: 'Accounts Payable Credit', value: 'ACCPAYCREDIT' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const creditNoteData: any = {
      Contact: {
        ContactID: propsValue.contact_id,
      },
      LineItems: propsValue.lineItems,
      Type: propsValue.type,
      ...(propsValue.date && { Date: propsValue.date }),
      ...(propsValue.reference && { Reference: propsValue.reference }),
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      '/CreditNotes',
      { CreditNotes: [creditNoteData] },
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
