import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { CANCEL_SLUG, ORDER_STATUS_SLUGS, sallaUtils } from '../../common/helpers';
import { sallaOrders } from '../../common/orders';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiUpdateOrderStatusAction = createAction({
  auth: sallaAuth,
  name: 'ai_update_order_status',
  classification: 'WRITE',
  displayName: 'Update Order Status',
  description: 'Moves an order to a new status, with an optional note.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves one Salla order to a new status, either a built-in slug such as shipped or completed, or a status ID from List Order Statuses for the merchant\'s custom sub-statuses. It refuses the canceled status and custom statuses under it: use Cancel Order to cancel an order. Use Add Order Note instead to only log a comment, and Update Order to change customer, address or payment details. Setting the same status again leaves the same state, but Salla may notify the customer again on each call.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.orderStatusUpdate,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description:
        'Internal order ID, the long number (2116149737), not the reference number customers see (41027662). Find it with List Orders using reference_id.',
      required: true,
    }),
    status: Property.ShortText({
      displayName: 'New Status',
      description: `Built-in status slug, one of: ${ORDER_STATUS_SLUGS.filter((slug) => slug !== CANCEL_SLUG).join(', ')}. Or a numeric status ID from List Order Statuses, for example 566146469, which is required for the merchant's custom statuses. The canceled status is not accepted here; use Cancel Order.`,
      required: true,
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional comment saved in the order history with the change, for example "Shipped with SMSA, tracking 290012345678".',
      required: false,
    }),
    restore_items: Property.StaticDropdown({
      displayName: 'Restore Items to Stock',
      description:
        'yes puts the order\'s items back in stock (use when restoring an order), no keeps stock as is, unchanged sends nothing and lets Salla decide. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: triStateOptions() },
    }),
    send_status_sms: Property.StaticDropdown({
      displayName: 'Send Status SMS',
      description:
        'yes texts the customer about the new status, no sends no SMS, unchanged sends nothing and lets Salla use the store setting. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: { disabled: false, options: triStateOptions() },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.updateOrderStatus({
      auth,
      orderId: propsValue.order_id,
      status: propsValue.status,
      note: propsValue.note,
      restoreItems: sallaUtils.triState(propsValue.restore_items),
      sendStatusSms: sallaUtils.triState(propsValue.send_status_sms),
    });
  },
});

function triStateOptions(): { label: string; value: string }[] {
  return [
    { label: 'Leave unchanged', value: 'unchanged' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ];
}
