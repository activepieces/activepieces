import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateQuoteDraft = createAction({
  auth: xeroAuth,
  name: 'xero_create_quote_draft',
  displayName: 'Create New Quote Draft',
  description: 'Creates a new draft quote.',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(true),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Date the quote was issued (YYYY-MM-DD).',
      required: true,
    }),
    expiry_date: Property.ShortText({
      displayName: 'Expiry Date',
      description: 'Date the quote expires (YYYY-MM-DD).',
      required: false,
    }),
    line_item: Property.Object({
      displayName: 'Line Item',
      description: 'At minimum, provide a Description.',
      required: true,
      defaultValue: {
        Description: 'Consulting services',
      },
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: {
        options: [
          { label: 'Exclusive', value: 'Exclusive' },
          { label: 'Inclusive', value: 'Inclusive' },
          { label: 'NoTax', value: 'NoTax' },
        ],
      },
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      required: false,
    }),
    quote_number: Property.ShortText({
      displayName: 'Quote Number',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    summary: Property.LongText({
      displayName: 'Summary',
      required: false,
    }),
    terms: Property.LongText({
      displayName: 'Terms',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
        ],
      },
      defaultValue: 'DRAFT',
    }),
  },
  async run(context) {
    const {
      tenant_id,
      contact_id,
      date,
      expiry_date,
      line_item,
      line_amount_types,
      reference,
      quote_number,
      title,
      summary,
      terms,
      status,
    } = context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/Quotes';

    const payload: Record<string, unknown> = {
      Quotes: [
        {
          Contact: { ContactID: contact_id },
          Date: date,
          ...(expiry_date ? { ExpiryDate: expiry_date } : {}),
          LineItems: [line_item],
          ...(line_amount_types ? { LineAmountTypes: line_amount_types } : {}),
          ...(reference ? { Reference: reference } : {}),
          ...(quote_number ? { QuoteNumber: quote_number } : {}),
          ...(title ? { Title: title } : {}),
          ...(summary ? { Summary: summary } : {}),
          ...(terms ? { Terms: terms } : {}),
          ...(status ? { Status: status } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


