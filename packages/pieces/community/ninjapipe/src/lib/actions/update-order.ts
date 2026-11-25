import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ninjapipeAuth } from '../auth';
import { ninjapipeClient } from '../common/client';
import { ninjapipeFields } from '../common/fields';
import { ninjapipeProps } from '../common/props';
import { ninjapipeSchemas } from '../output-schemas';

export const updateOrder = createAction({
  auth: ninjapipeAuth,
  name: 'update_order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Updates a order. Fields left blank keep their value; use Clear Fields to empty them.',
  audience: 'both',
  aiMetadata: {
    description: 'Update a NinjaPipe order by ID. Only filled fields change and Clear Fields empties fields. Re-running with the same input gives the same result.',
    idempotent: true,
  },
  outputSchema: ninjapipeSchemas.order,
  props: {
    orderId: ninjapipeProps.orderRequired(),
    customerName: Property.ShortText({ displayName: 'Customer Name', required: false }),
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
    clearFields: ninjapipeProps.clearFields({ fields: { customer_email: 'Customer Email', customer_company: 'Customer Company', contact_id: 'Contact', order_number: 'Order Number', order_date: 'Order Date', delivery_date: 'Delivery Date', tracking_number: 'Tracking Number', notes: 'Notes' } }),
  },
  async run(context) {
    const auth = ninjapipeClient.readAuth(context.auth);
    const p = context.propsValue;
    const path = `/orders/${ninjapipeClient.pathId({ value: p.orderId, field: 'Order' })}`;
    const changes = ninjapipeFields.compact({
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
    const body = ninjapipeFields.requireChanges({ body: ninjapipeFields.withClears({ body: changes, clear: p.clearFields }), what: 'order' });
    return ninjapipeClient.sendRecord({ auth, method: HttpMethod.PUT, path, body, operation: 'update order' });
  },
});
