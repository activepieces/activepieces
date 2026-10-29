import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const createOrder = createAction({
  auth: ninjapipeAuth,
  name: 'create_order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Creates an order.',
  audience: 'both',
  aiMetadata: {
    description: 'Create a NinjaPipe order. Required: customer_name. Not idempotent: each call creates another order.',
    idempotent: false,
  },
  outputSchema: ninjapipeSchemas.order,
  props: {
    customerName: Property.ShortText({ displayName: 'Customer Name', required: true }),
    customerEmail: Property.ShortText({ displayName: 'Customer Email', required: false }),
    customerCompany: Property.ShortText({ displayName: 'Customer Company', required: false }),
    contactId: ninjapipeProps.contactOptional(),
    orderNumber: Property.ShortText({ displayName: 'Order Number', required: false }),
    totalAmount: Property.Number({ displayName: 'Total Amount', required: false }),
    status: ninjapipeProps.staticDropdown({ displayName: 'Status', description: 'Status.', values: ['Processing', 'Shipped', 'Delivered', 'Cancelled'] }),
    paymentStatus: ninjapipeProps.staticDropdown({ displayName: 'Payment Status', description: 'Payment Status.', values: ['Pending', 'Paid', 'Refunded', 'Failed'] }),
    orderDate: Property.DateTime({ displayName: 'Order Date', description: 'Date (YYYY-MM-DD).', required: false }),
    deliveryDate: Property.DateTime({ displayName: 'Delivery Date', description: 'Date (YYYY-MM-DD).', required: false }),
    priority: ninjapipeProps.staticDropdown({ displayName: 'Priority', description: 'Priority.', values: ['High', 'Medium', 'Low'] }),
    trackingNumber: Property.ShortText({ displayName: 'Tracking Number', required: false }),
    notes: Property.LongText({ displayName: 'Notes', required: false }),
  },
  async run(context) {
    const p = context.propsValue;
    const body = ninjapipeFields.compact({
      customer_name: p.customerName,
      customer_email: p.customerEmail,
      customer_company: p.customerCompany,
      contact_id: p.contactId,
      order_number: p.orderNumber,
      total_amount: ninjapipeFields.toNumber({ value: p.totalAmount, field: 'Total Amount' }),
      status: p.status,
      payment_status: p.paymentStatus,
      order_date: ninjapipeFields.toDateOnly({ value: p.orderDate, field: 'Order Date' }),
      delivery_date: ninjapipeFields.toDateOnly({ value: p.deliveryDate, field: 'Delivery Date' }),
      priority: p.priority,
      tracking_number: p.trackingNumber,
      notes: p.notes,
    });
    return ninjapipeClient.sendRecord({
      auth: ninjapipeClient.readAuth(context.auth),
      method: HttpMethod.POST,
      path: '/orders',
      body,
      operation: 'create order',
    });
  },
});
