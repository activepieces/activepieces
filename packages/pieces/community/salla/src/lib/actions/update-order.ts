import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { sallaUtils } from '../common/helpers';
import {
  addressPropNames,
  DeliveryMethod,
  orderAddressProps,
  PaymentStatus,
  paymentMethodOptions,
  readAddress,
  readReceiver,
} from './create-order';

export const updateOrderAction = createAction({
  auth: sallaAuth,
  name: 'update_order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Changes the customer, receiver, delivery or payment details of an order.',
  audience: 'human',
  aiMetadata: {
    description:
      'Updates one Salla order, by its internal order ID (2116149737), and changes only the fields you fill: customer, receiver, delivery method and address, payment, coupon or assigned employees. Use Update Order Status to change the status and Add Order Note to add a note. Sending the same values again gives the same result, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.order,
  propertyGroups: [
    {
      key: 'order',
      display: 'section',
      label: 'Order',
      icon: 'file',
      props: ['order'],
    },
    {
      key: 'customer',
      display: 'section',
      label: 'Customer',
      description: 'Fill only what changes.',
      icon: 'user',
      props: ['customer', 'customer_name', 'customer_mobile', 'customer_email'],
    },
    {
      key: 'delivery',
      display: 'section',
      label: 'Delivery',
      description: 'To change the address, fill every National Address field: Salla rejects a partial address.',
      icon: 'send',
      props: ['delivery_method', 'branch', 'courier_id', ...addressPropNames()],
    },
    {
      key: 'payment',
      display: 'section',
      label: 'Payment',
      icon: 'tag',
      props: ['payment_status', 'payment_method', 'accepted_methods', 'store_bank_id', 'receipt_image_url', 'cash_on_delivery_fee'],
    },
    {
      key: 'receiver',
      display: 'section',
      label: 'Receiver',
      icon: 'send',
      props: ['receiver_name', 'receiver_phone', 'receiver_email', 'receiver_country_code', 'receiver_notify'],
    },
  ],
  props: {
    order: sallaProps.order({ required: true }),
    customer: sallaProps.customer({
      required: false,
      displayName: 'Customer',
      description: 'Move the order to this customer. Search by name or mobile, or map a customer ID such as 1227534533. Leave empty to keep the current customer.',
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'New full name of the order customer, for example "Sara Alqahtani". Leave empty to keep it.',
      placeholder: 'Sara Alqahtani',
      width: 'half',
      required: false,
    }),
    customer_mobile: Property.ShortText({
      displayName: 'Customer Mobile',
      description: 'New mobile with country code, for example +966501234567. Leave empty to keep it.',
      placeholder: '+966501234567',
      width: 'half',
      required: false,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'New email of the order customer, for example sara@example.com. Leave empty to keep it.',
      placeholder: 'sara@example.com',
      required: false,
    }),
    delivery_method: Property.StaticDropdown<DeliveryMethod | 'unchanged', false>({
      displayName: 'Delivery Method',
      description: 'Shipping sends the order to the address below; Pickup needs a branch.',
      width: 'half',
      required: false,
      defaultValue: 'unchanged',
      options: {
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Shipping', value: 'shipping' },
          { label: 'Pickup from branch', value: 'pickup' },
        ],
      },
    }),
    branch: sallaProps.branch({
      required: false,
      description: 'Branch the order is picked up from or shipped by. Leave empty to keep it.',
    }),
    courier_id: Property.ShortText({
      displayName: 'Courier ID',
      description: 'Numeric ID of the shipping company from Salla\'s Shipping Companies list, for example 1723506348. Leave empty to keep it.',
      placeholder: '1723506348',
      width: 'half',
      required: false,
    }),
    ...orderAddressProps(),
    payment_status: Property.StaticDropdown<PaymentStatus, false>({
      displayName: 'Payment Status',
      description: 'New payment status. Leave empty to keep it.',
      width: 'half',
      required: false,
      options: {
        options: [
          { label: 'Paid', value: 'paid' },
          { label: 'Pending payment', value: 'pending_payment' },
        ],
      },
    }),
    payment_method: Property.StaticDropdown<string, false>({
      displayName: 'Payment Method',
      description: 'How the customer paid. Leave empty to keep it.',
      width: 'half',
      required: false,
      options: { options: paymentMethodOptions({ includeSubscription: true }) },
    }),
    accepted_methods: Property.StaticMultiSelectDropdown<string, false>({
      displayName: 'Accepted Payment Methods',
      description: 'Methods the customer may pay with while payment is pending, for example Mada and Credit card. Leave empty to keep them.',
      required: false,
      options: { options: paymentMethodOptions({ includeSubscription: false }) },
    }),
    store_bank_id: Property.ShortText({
      displayName: 'Store Bank ID',
      description: 'Numeric ID of the store bank account the customer transferred to, for example 1879023422. Used with Bank transfer.',
      placeholder: '1879023422',
      width: 'half',
      required: false,
    }),
    receipt_image_url: Property.ShortText({
      displayName: 'Receipt Image URL',
      description: 'Public link to the bank transfer receipt, for example https://example.com/receipts/order-1001.pdf. Needed when Payment Method is Bank transfer.',
      placeholder: 'https://example.com/receipts/order-1001.pdf',
      required: false,
    }),
    cash_on_delivery_fee: Property.Number({
      displayName: 'Cash on Delivery Fee',
      description: 'Optional fee for cash on delivery, for example 10. Used only when Payment Method is Cash on delivery. Leave empty for no fee. The store currency is used automatically.',
      width: 'half',
      required: false,
    }),
    receiver_name: Property.ShortText({
      displayName: 'Receiver Name',
      description: 'Name of the person who receives the order, for example "Omar Alharbi". Leave empty to keep it.',
      placeholder: 'Omar Alharbi',
      width: 'half',
      required: false,
    }),
    receiver_phone: Property.ShortText({
      displayName: 'Receiver Phone',
      description: 'Receiver mobile with country code, for example +966551234567. Leave empty to keep it.',
      placeholder: '+966551234567',
      width: 'half',
      required: false,
    }),
    receiver_email: Property.ShortText({
      displayName: 'Receiver Email',
      description: 'Receiver email, for example omar@example.com. Leave empty to keep it.',
      placeholder: 'omar@example.com',
      width: 'half',
      required: false,
    }),
    receiver_country_code: Property.ShortText({
      displayName: 'Receiver Country Code',
      description: 'Two-letter country code of the receiver phone, for example SA. Leave empty to keep it.',
      placeholder: 'SA',
      width: 'half',
      required: false,
    }),
    receiver_notify: Property.StaticDropdown<'unchanged' | 'yes' | 'no', false>({
      displayName: 'Notify Receiver',
      description: 'Send the receiver the order notifications.',
      required: false,
      defaultValue: 'unchanged',
      options: {
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    coupon_code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'Store coupon to apply to the order, for example WELCOME10. Leave empty to keep the current one.',
      placeholder: 'WELCOME10',
      advanced: true,
      required: false,
    }),
    employee_ids: Property.Array({
      displayName: 'Assigned Employee IDs',
      description: 'Numeric IDs of the store employees to assign to the order, one per row, for example 1939592358. Leave empty to keep the current assignment.',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const deliveryMethod = propsValue.delivery_method;
    return sallaOrders.updateOrder({
      auth,
      orderId: propsValue.order,
      input: {
        customer: {
          id: propsValue.customer ?? undefined,
          name: propsValue.customer_name ?? undefined,
          mobile: propsValue.customer_mobile ?? undefined,
          email: propsValue.customer_email ?? undefined,
        },
        receiver: readReceiver({ values: propsValue, notify: sallaUtils.triState(propsValue.receiver_notify) }),
        deliveryMethod: deliveryMethod === 'shipping' || deliveryMethod === 'pickup' ? deliveryMethod : undefined,
        branchId: propsValue.branch ?? undefined,
        courierId: propsValue.courier_id ?? undefined,
        shipTo: readAddress(propsValue),
        payment: {
          status: propsValue.payment_status ?? undefined,
          method: propsValue.payment_method ?? undefined,
          storeBankId: propsValue.store_bank_id ?? undefined,
          receiptImagePath: propsValue.receipt_image_url ?? undefined,
          acceptedMethods: propsValue.accepted_methods ?? [],
          cashOnDeliveryFee: propsValue.cash_on_delivery_fee ?? undefined,
        },
        couponCode: propsValue.coupon_code ?? undefined,
        employeeIds: sallaUtils.toStringList(propsValue.employee_ids),
      },
    });
  },
});
