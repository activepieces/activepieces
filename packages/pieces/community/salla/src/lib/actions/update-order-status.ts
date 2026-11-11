import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaUtils } from '../common/helpers';

export const updateOrderStatusAction = createAction({
  auth: sallaAuth,
  name: 'update_order_status',
  classification: 'WRITE',
  displayName: 'Update Order Status',
  description: 'Moves an order to a new status, optionally with a note.',
  audience: 'human',
  aiMetadata: {
    description:
      'Sets the status of one Salla order, by its internal order ID (2116149737), to a built-in or custom status, with an optional note in the order history. It does not cancel orders: use Cancel Order for that. Use Add Order Note to leave a note without a status change. Setting the same status again is safe, but the customer may get the status SMS each time.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.orderStatusUpdate,
  props: {
    order: sallaProps.order({ required: true }),
    status: sallaProps.orderStatus({
      required: true,
      excludeCancel: true,
      description:
        'New status, including custom statuses created in this store. In a flow, map a status ID from List Order Statuses (for example 566146469) or a built-in slug such as completed or shipped. To cancel an order, use the Cancel Order action.',
    }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional note saved in the order history with the status change, for example "Handed to the courier at 3 PM."',
      required: false,
    }),
    restore_stock: Property.StaticDropdown<TriStateValue, false>({
      displayName: 'Restore Stock',
      description: 'Return the ordered quantities to stock, used when restoring an order. "Leave unchanged" lets Salla decide.',
      required: false,
      defaultValue: 'unchanged',
      advanced: true,
      options: { options: triStateOptions() },
    }),
    send_status_sms: Property.StaticDropdown<TriStateValue, false>({
      displayName: 'Send Status SMS',
      description: 'Send the customer the SMS for the new status. "Leave unchanged" uses the store setting.',
      required: false,
      defaultValue: 'unchanged',
      advanced: true,
      options: { options: triStateOptions() },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.updateOrderStatus({
      auth,
      orderId: propsValue.order,
      status: propsValue.status ?? '',
      note: propsValue.note ?? undefined,
      restoreItems: sallaUtils.triState(propsValue.restore_stock),
      sendStatusSms: sallaUtils.triState(propsValue.send_status_sms),
    });
  },
});

function triStateOptions(): Array<{ label: string; value: TriStateValue }> {
  return [
    { label: 'Leave unchanged', value: 'unchanged' },
    { label: 'Yes', value: 'yes' },
    { label: 'No', value: 'no' },
  ];
}

type TriStateValue = 'unchanged' | 'yes' | 'no';
