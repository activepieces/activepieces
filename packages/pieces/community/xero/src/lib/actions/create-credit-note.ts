import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateCreditNote = createAction({
  auth: xeroAuth,
  name: 'xero_create_credit_note',
  displayName: 'Create Credit Note',
  description: 'Creates a new credit note for a contact.',
  props: {
    tenant_id: props.tenant_id,
    type: Property.StaticDropdown({
      displayName: 'Type',
      required: true,
      options: {
        options: [
          { label: 'Accounts Receivable Credit (ACCRECCREDIT)', value: 'ACCRECCREDIT' },
          { label: 'Accounts Payable Credit (ACCPAYCREDIT)', value: 'ACCPAYCREDIT' },
        ],
      },
      defaultValue: 'ACCRECCREDIT',
    }),
    contact_id: props.contact_dropdown(true),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'YYYY-MM-DD. Defaults to today if not provided.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Authorised', value: 'AUTHORISED' },
        ],
      },
      defaultValue: 'DRAFT',
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
    credit_note_number: Property.ShortText({
      displayName: 'Credit Note Number',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference (ACCRECCREDIT only)',
      required: false,
    }),
    currency_code: Property.ShortText({
      displayName: 'Currency Code',
      required: false,
    }),
    branding_theme_id: props.branding_theme_id(false),
    line_items: Property.Array({
      displayName: 'Line Items',
      description: 'Add one or more line items. At minimum, each line needs a Description.',
      required: false,
      properties: {
        Description: Property.ShortText({ displayName: 'Description', required: true }),
        Quantity: Property.Number({ displayName: 'Quantity', required: false }),
        UnitAmount: Property.Number({ displayName: 'Unit Amount', required: false }),
        AccountCode: Property.ShortText({ displayName: 'Account Code', required: false }),
        ItemCode: Property.ShortText({ displayName: 'Item Code', required: false }),
        TaxType: Property.ShortText({ displayName: 'Tax Type', required: false }),
      },
    }),
  },
  async run(context) {
    const {
      tenant_id,
      type,
      contact_id,
      date,
      status,
      line_amount_types,
      credit_note_number,
      reference,
      currency_code,
      branding_theme_id,
      line_items,
    } = context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/CreditNotes';

    const payload: Record<string, unknown> = {
      CreditNotes: [
        {
          Type: type,
          Contact: { ContactID: contact_id },
          ...(date ? { Date: date } : {}),
          ...(status ? { Status: status } : {}),
          ...(line_amount_types ? { LineAmountTypes: line_amount_types } : {}),
          ...(currency_code ? { CurrencyCode: currency_code } : {}),
          ...(credit_note_number ? { CreditNoteNumber: credit_note_number } : {}),
          ...(reference && type === 'ACCRECCREDIT' ? { Reference: reference } : {}),
          ...(branding_theme_id ? { BrandingThemeID: branding_theme_id } : {}),
          ...(line_items && Array.isArray(line_items) && line_items.length > 0
            ? { LineItems: line_items }
            : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: payload,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
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


