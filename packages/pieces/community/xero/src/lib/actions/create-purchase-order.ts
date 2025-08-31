import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreatePurchaseOrder = createAction({
  auth: xeroAuth,
  name: 'xero_create_purchase_order',
  displayName: 'Create Purchase Order',
  description: 'Creates a new purchase order for a contact.',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(true),
    line_item: Property.Object({
      displayName: 'Line Item',
      description: 'At minimum, provide a Description.',
      required: true,
      defaultValue: {
        Description: 'Item',
      },
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Date the purchase order was issued (YYYY-MM-DD). Optional.',
      required: false,
    }),
    delivery_date: Property.ShortText({
      displayName: 'Delivery Date',
      description: 'Date goods are to be delivered (YYYY-MM-DD). Optional.',
      required: false,
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
    purchase_order_number: Property.ShortText({
      displayName: 'Purchase Order Number',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      required: false,
    }),
    branding_theme_id: props.branding_theme_id(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Billed', value: 'BILLED' },
          { label: 'Deleted', value: 'DELETED' },
        ],
      },
      defaultValue: 'DRAFT',
    }),
    delivery_address: Property.LongText({
      displayName: 'Delivery Address',
      required: false,
    }),
    attention_to: Property.ShortText({
      displayName: 'Attention To',
      required: false,
    }),
    telephone: Property.ShortText({
      displayName: 'Telephone',
      required: false,
    }),
    delivery_instructions: Property.LongText({
      displayName: 'Delivery Instructions',
      required: false,
    }),
    expected_arrival_date: Property.ShortText({
      displayName: 'Expected Arrival Date',
      description: 'YYYY-MM-DD. Optional.',
      required: false,
    }),
  },
  async run(context) {
    const {
      tenant_id,
      contact_id,
      line_item,
      date,
      delivery_date,
      line_amount_types,
      purchase_order_number,
      reference,
      branding_theme_id,
      status,
      delivery_address,
      attention_to,
      telephone,
      delivery_instructions,
      expected_arrival_date,
    } = context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/PurchaseOrders';

    const payload: Record<string, unknown> = {
      PurchaseOrders: [
        {
          Contact: { ContactID: contact_id },
          LineItems: [line_item],
          ...(date ? { Date: date } : {}),
          ...(delivery_date ? { DeliveryDate: delivery_date } : {}),
          ...(line_amount_types ? { LineAmountTypes: line_amount_types } : {}),
          ...(purchase_order_number ? { PurchaseOrderNumber: purchase_order_number } : {}),
          ...(reference ? { Reference: reference } : {}),
          ...(branding_theme_id ? { BrandingThemeID: branding_theme_id } : {}),
          ...(status ? { Status: status } : {}),
          ...(delivery_address ? { DeliveryAddress: delivery_address } : {}),
          ...(attention_to ? { AttentionTo: attention_to } : {}),
          ...(telephone ? { Telephone: telephone } : {}),
          ...(delivery_instructions ? { DeliveryInstructions: delivery_instructions } : {}),
          ...(expected_arrival_date ? { ExpectedArrivalDate: expected_arrival_date } : {}),
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


