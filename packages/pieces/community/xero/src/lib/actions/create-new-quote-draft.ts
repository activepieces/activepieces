import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { props } from '../common/props';

export const createNewQuoteDraft = createAction({
  auth: xeroAuth,
  name: 'createNewQuoteDraft',
  displayName: 'Create New Quote Draft',
  description: 'Creates a new draft quote in Xero',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_id(true),
    date: Property.ShortText({
      displayName: 'Date',
      description:
        'The date of the quote (YYYY-MM-DD format). Defaults to today if not provided.',
      required: false,
    }),
    expiryDate: Property.ShortText({
      displayName: 'Expiry Date',
      description:
        'The expiry date of the quote (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for the quote',
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
      description: 'Optional reference for the quote',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Optional title for the quote',
      required: false,
    }),
    summary: Property.ShortText({
      displayName: 'Summary',
      description: 'Optional summary for the quote',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const currentDate = new Date().toISOString().split('T')[0];
    const quoteDate = propsValue.date || currentDate;

    const quoteData: any = {
      Contact: {
        ContactID: propsValue.contact_id,
      },
      Date: quoteDate,
      LineItems: propsValue.lineItems,
      Status: 'DRAFT',
    };

    if (propsValue.expiryDate) {
      quoteData.ExpiryDate = propsValue.expiryDate;
    }
    if (propsValue.reference) {
      quoteData.Reference = propsValue.reference;
    }
    if (propsValue.title) {
      quoteData.Title = propsValue.title;
    }
    if (propsValue.summary) {
      quoteData.Summary = propsValue.summary;
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      '/Quotes',
      { Quotes: [quoteData] },
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
