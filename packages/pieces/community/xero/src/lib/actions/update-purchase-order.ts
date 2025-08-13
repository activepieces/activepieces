import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroUpdatePurchaseOrder = createAction({
  auth: xeroAuth,
  name: 'xero_update_purchase_order',
  displayName: 'Update Purchase Order',
  description: 'Updates details of an existing purchase order.',
  props: {
    tenant_id: props.tenant_id,
    purchase_order_id: props.purchase_order_id(true),
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
    }),
    sent_to_contact: Property.Checkbox({
      displayName: 'Mark as Sent to Contact',
      required: false,
      defaultValue: false,
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
      displayName: 'Expected Arrival Date (YYYY-MM-DD)',
      required: false,
    }),
  },
  async run(context) {
    const {
      tenant_id,
      purchase_order_id,
      status,
      sent_to_contact,
      delivery_address,
      attention_to,
      telephone,
      delivery_instructions,
      expected_arrival_date,
    } = context.propsValue;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/PurchaseOrders';
    const url = `${baseUrl}/${purchase_order_id}`;

    const body: Record<string, unknown> = {
      PurchaseOrders: [
        {
          PurchaseOrderID: purchase_order_id,
          ...(status ? { Status: status } : {}),
          ...(typeof sent_to_contact === 'boolean'
            ? { SentToContact: sent_to_contact }
            : {}),
          ...(delivery_address ? { DeliveryAddress: delivery_address } : {}),
          ...(attention_to ? { AttentionTo: attention_to } : {}),
          ...(telephone ? { Telephone: telephone } : {}),
          ...(delivery_instructions
            ? { DeliveryInstructions: delivery_instructions }
            : {}),
          ...(expected_arrival_date
            ? { ExpectedArrivalDate: expected_arrival_date }
            : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body,
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


