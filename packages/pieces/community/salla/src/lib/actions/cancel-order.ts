import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaUtils } from '../common/helpers';

export const cancelOrderAction = createAction({
  auth: sallaAuth,
  name: 'cancel_order',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Order',
  description: 'Cancels an order, optionally with a note.',
  audience: 'both',
  aiMetadata: {
    description:
      'Cancels one Salla order, identified by its internal order ID (2116149737), by moving it to the built-in canceled status, with an optional note in the order history. Use Update Order Status for every other status change. Salla may notify the customer on each call, and a repeat with Restore Stock set to yes may return the quantities to stock again, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.orderStatusUpdate,
  props: {
    order: sallaProps.order({ required: true }),
    note: Property.LongText({
      displayName: 'Note',
      description: 'Optional reason saved in the order history, for example "Customer asked to cancel by phone."',
      required: false,
    }),
    restore_stock: Property.StaticDropdown<TriStateValue, false>({
      displayName: 'Restore Stock',
      description: 'Return the ordered quantities to stock. "Leave unchanged" lets Salla decide.',
      required: false,
      defaultValue: 'unchanged',
      advanced: true,
      options: { options: triStateOptions() },
    }),
    send_status_sms: Property.StaticDropdown<TriStateValue, false>({
      displayName: 'Send Status SMS',
      description: 'Send the customer the cancellation SMS. "Leave unchanged" uses the store setting.',
      required: false,
      defaultValue: 'unchanged',
      advanced: true,
      options: { options: triStateOptions() },
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.cancelOrder({
      auth,
      orderId: propsValue.order,
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
