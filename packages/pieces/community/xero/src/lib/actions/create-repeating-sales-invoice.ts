import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createRepeatingSalesInvoice = createAction({
  auth: xeroAuth,
  name: 'createRepeatingSalesInvoice',
  displayName: 'Create Repeating Sales Invoice',
  description:
    'Creates a repeating sales invoice (Accounts Receivable) in Xero',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_id(true),
    schedulePeriod: Property.StaticDropdown({
      displayName: 'Schedule Period',
      description: 'The frequency of the repeating invoice',
      required: true,
      options: {
        options: [
          { label: 'Weekly', value: 'WEEKLY' },
          { label: 'Monthly', value: 'MONTHLY' },
          { label: 'Two Monthly', value: 'TWOMONTHLY' },
          { label: 'Quarterly', value: 'QUARTERLY' },
          { label: 'Six Monthly', value: 'SIXMONTHLY' },
          { label: 'Annually', value: 'ANNUALLY' },
        ],
      },
    }),
    scheduleStartDate: Property.ShortText({
      displayName: 'Start Date',
      description:
        'The start date of the repeating invoice (YYYY-MM-DD format)',
      required: true,
    }),
    scheduleEndDate: Property.ShortText({
      displayName: 'End Date',
      description:
        'The end date of the repeating invoice (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for the repeating invoice',
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
      description: 'Optional reference for the repeating invoice',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the repeating invoice',
      required: true,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Authorised', value: 'AUTHORISED' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    // Build the repeating invoice data
    const repeatingInvoiceData: any = {
      Contact: {
        ContactID: propsValue.contact_id,
      },
      Schedule: {
        Period: propsValue.schedulePeriod,
        StartDate: propsValue.scheduleStartDate,
        ...(propsValue.scheduleEndDate && {
          EndDate: propsValue.scheduleEndDate,
        }),
      },
      LineItems: propsValue.lineItems,
      Status: propsValue.status,
      ...(propsValue.reference && { Reference: propsValue.reference }),
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      '/RepeatingInvoices',
      { RepeatingInvoices: [repeatingInvoiceData] },
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
