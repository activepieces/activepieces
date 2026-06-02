import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { request, virtualSmsAuth } from '../common';

interface SmsMessage {
  code?: string;
  text?: string;
  received_at?: string;
}

interface OrderStatusResp {
  success?: boolean;
  order_id?: string;
  phone_number?: string;
  service?: string;
  country?: string;
  status?: string;
  price?: number;
  sms_received?: boolean;
  created_at?: string;
  expires_at?: string;
  messages?: SmsMessage[];
}

export const getOrderStatus = createAction({
  auth: virtualSmsAuth,
  name: 'get_order_status',
  displayName: 'Get Order Status',
  description:
    'Get current status and any received SMS for an order. The sms_code field contains the extracted OTP.',
  props: {
    order_id: Property.ShortText({
      displayName: 'Order ID',
      description: 'Order UUID returned by Buy Number',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const resp = await request<OrderStatusResp>(
      auth,
      HttpMethod.GET,
      `/api/v1/customer/order/${encodeURIComponent(propsValue.order_id)}`
    );
    const { messages, ...flat } = resp;
    const latest = messages?.[0];
    return {
      ...flat,
      sms_code: latest?.code ?? null,
      sms_text: latest?.text ?? null,
      sms_received_at: latest?.received_at ?? null,
      message_count: messages?.length ?? 0,
    };
  },
});
