import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, flattenCustomFields, getAuth, ninjapipeCommon, toDateOnly } from '../common';

export const createOrder = createAction({
  auth: ninjapipeAuth,
  name: 'create_order',
  displayName: 'Create Order',
  description: 'Creates a new order. Line items, currency, and custom fields go in Settings JSON.',
  props: {
    customerName: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Customer display name.',
      required: true,
    }),
    customerEmail: Property.ShortText({ displayName: 'Customer Email', required: false }),
    customerCompany: Property.ShortText({ displayName: 'Customer Company', required: false }),
    contactId: ninjapipeCommon.contactDropdown,
    orderNumber: Property.ShortText({
      displayName: 'Order Number',
      description: 'Defaults to ORD-<timestamp> if omitted.',
      required: false,
    }),
    totalAmount: Property.Number({ displayName: 'Total Amount', required: false }),
    status: ninjapipeCommon.orderStatusDropdown,
    paymentStatus: ninjapipeCommon.paymentStatusDropdown,
    orderDate: Property.DateTime({
      displayName: 'Order Date',
      required: false,
    }),
    deliveryDate: Property.DateTime({
      displayName: 'Delivery Date',
      required: false,
    }),
    priority: ninjapipeCommon.priorityDropdown,
    trackingNumber: Property.ShortText({ displayName: 'Tracking Number', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
    settingsJson: Property.Object({
      displayName: 'Settings JSON',
      description: 'Line items, currency, and custom fields. Example: {"currency":"USD","items":[{"name":"…","price":10}],"custom_fields":[]}.',
      required: false,
    }),
  },
  async run(context) {
    const auth = getAuth(context);
    const p = context.propsValue;
    const body: Record<string, unknown> = { customer_name: p.customerName };
    if (p.customerEmail) body['customer_email'] = p.customerEmail;
    if (p.customerCompany) body['customer_company'] = p.customerCompany;
    if (p.contactId) body['contact_id'] = p.contactId;
    if (p.orderNumber) body['order_number'] = p.orderNumber;
    if (p.totalAmount !== undefined && p.totalAmount !== null) body['total_amount'] = p.totalAmount;
    if (p.status) body['status'] = p.status;
    if (p.paymentStatus) body['payment_status'] = p.paymentStatus;
    {
      const v = toDateOnly(p.orderDate);
      if (v) body['order_date'] = v;
    }
    {
      const v = toDateOnly(p.deliveryDate);
      if (v) body['delivery_date'] = v;
    }
    if (p.priority) body['priority'] = p.priority;
    if (p.trackingNumber) body['tracking_number'] = p.trackingNumber;
    if (p.notes) body['notes'] = p.notes;
    if (p.settingsJson && typeof p.settingsJson === 'object' && Object.keys(p.settingsJson).length > 0) {
      body['settings_json'] = p.settingsJson;
    }
    const response = await ninjapipeApiCall<Record<string, unknown>>({
      auth,
      method: HttpMethod.POST,
      path: '/orders',
      body,
    });
    return flattenCustomFields(response.body);
  },
});
