import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaUtils } from '../../common/helpers';
import { sallaOrders } from '../../common/orders';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiUpdateOrderAction = createAction({
  auth: sallaAuth,
  name: 'ai_update_order',
  classification: 'WRITE',
  displayName: 'Update Order',
  description: 'Changes customer, receiver, shipping, payment, coupon or assigned employees on an order.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes the details of an existing Salla order: customer, receiver, delivery and shipping address, payment, coupon or assigned employees. Only the fields you fill are sent; empty fields stay as they are. Use Update Order Status to change the status, Add Order Note to log a comment, and Update Customer to change a customer\'s name, mobile or email (this action only moves the order to another existing customer); Salla rejects receiver, shipping and coupon changes on completed orders and payment changes unless the order is pending.',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.order,
  props: {
    order_id: Property.Number({
      displayName: 'Order ID',
      description:
        'Internal order ID, the long number (2116149737), not the reference number customers see (41027662). Find it with List Orders using reference_id.',
      required: true,
    }),
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Numeric ID of an existing Salla customer to move the order to, for example 1209983424. Find it with List Customers. Leave empty to keep the current customer.',
      required: false,
    }),
    receiver_name: Property.ShortText({
      displayName: 'Receiver Name',
      description: 'Name of the person receiving the order, for example Ahmed Al-Harbi.',
      required: false,
    }),
    receiver_phone: Property.ShortText({
      displayName: 'Receiver Phone',
      description: 'Receiver phone in international format, for example +966566666666.',
      required: false,
    }),
    receiver_email: Property.ShortText({
      displayName: 'Receiver Email',
      description: 'Receiver email, for example ahmed@example.com.',
      required: false,
    }),
    receiver_country_code: Property.ShortText({
      displayName: 'Receiver Country Code',
      description: 'Two-letter ISO country code of the receiver phone, for example SA.',
      required: false,
    }),
    receiver_notify: Property.StaticDropdown({
      displayName: 'Notify Receiver',
      description: 'yes tells Salla to notify the receiver about the update, no does not, unchanged sends nothing. Default unchanged.',
      required: false,
      defaultValue: 'unchanged',
      options: {
        disabled: false,
        options: [
          { label: 'Leave unchanged', value: 'unchanged' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    delivery_method: Property.StaticDropdown({
      displayName: 'Delivery Method',
      description: 'shipping or pickup. Leave empty to keep the current method.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Shipping', value: 'shipping' },
          { label: 'Pickup', value: 'pickup' },
        ],
      },
    }),
    branch_id: Property.Number({
      displayName: 'Branch ID',
      description: 'Numeric branch ID from List Branches, for example 999858679.',
      required: false,
    }),
    courier_id: Property.Number({
      displayName: 'Courier ID',
      description: 'Numeric ID of the store\'s shipping company, for example 1433878184.',
      required: false,
    }),
    ship_to_country_id: Property.Number({
      displayName: 'Ship To Country ID',
      description:
        'Salla country ID (a Salla number, not an ISO code). To change the address, fill every ship_to_* field plus latitude and longitude: Salla needs the full National Address.',
      required: false,
    }),
    ship_to_city_id: Property.Number({
      displayName: 'Ship To City ID',
      description: 'Salla city ID, for example 1939592358.',
      required: false,
    }),
    ship_to_district_id: Property.Number({
      displayName: 'Ship To District ID',
      description: 'Salla district ID, for example 1939592358.',
      required: false,
    }),
    ship_to_block: Property.ShortText({
      displayName: 'Ship To Block',
      description: 'Neighbourhood or block name, for example Al Olaya.',
      required: false,
    }),
    ship_to_street_number: Property.ShortText({
      displayName: 'Ship To Street Number',
      description: 'Street number or name, for example 8230.',
      required: false,
    }),
    ship_to_address_line: Property.ShortText({
      displayName: 'Ship To Address Line',
      description: 'Full street address, for example 7124 Prince Sultan Road, Al Olaya, Riyadh.',
      required: false,
    }),
    ship_to_postal_code: Property.ShortText({
      displayName: 'Ship To Postal Code',
      description: 'Postal code, 5 digits in Saudi Arabia, for example 12211.',
      required: false,
    }),
    ship_to_short_address: Property.ShortText({
      displayName: 'Ship To Short Address',
      description: 'Saudi National Address short code, 4 letters and 4 digits, for example JCMA3429.',
      required: false,
    }),
    ship_to_building_number: Property.ShortText({
      displayName: 'Ship To Building Number',
      description: 'Saudi National Address building number, 4 digits, for example 7124.',
      required: false,
    }),
    ship_to_additional_number: Property.ShortText({
      displayName: 'Ship To Additional Number',
      description: 'Saudi National Address additional number, 4 digits, for example 6558.',
      required: false,
    }),
    latitude: Property.Number({
      displayName: 'Ship To Latitude',
      description: 'Latitude of the delivery point in decimal degrees, for example 24.6888248. Sent only together with longitude.',
      required: false,
    }),
    longitude: Property.Number({
      displayName: 'Ship To Longitude',
      description: 'Longitude of the delivery point in decimal degrees, for example 46.686327. Sent only together with latitude.',
      required: false,
    }),
    payment_status: Property.StaticDropdown({
      displayName: 'Payment Status',
      description: 'paid or pending_payment. Leave empty to keep it. Salla changes payment only while the order is pending.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Paid', value: 'paid' },
          { label: 'Pending Payment', value: 'pending_payment' },
        ],
      },
    }),
    payment_method: Property.ShortText({
      displayName: 'Payment Method',
      description: 'Payment method slug, for example bank, cod, mada or credit_card. See List Payment Methods for the store\'s slugs.',
      required: false,
    }),
    store_bank_id: Property.Number({
      displayName: 'Store Bank ID',
      description: 'ID of the store bank account the customer transferred to, for example 234234. Use with payment_method bank.',
      required: false,
    }),
    receipt_image_url: Property.ShortText({
      displayName: 'Receipt Image URL',
      description: 'Public URL of the bank transfer receipt, for example https://cdn.example.com/receipts/41027662.jpg.',
      required: false,
    }),
    accepted_methods: Property.ShortText({
      displayName: 'Accepted Payment Methods',
      description: 'Comma-separated payment method slugs the customer may pay with, for example bank, credit_card. Leave empty to keep them unchanged.',
      required: false,
    }),
    cash_on_delivery_fee: Property.Number({
      displayName: 'Cash on Delivery Fee',
      description: 'Optional fee for cash on delivery, for example 10. Used only when payment_method is cod. Leave empty for no fee. The store currency is used automatically.',
      required: false,
    }),
    coupon_code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'Store coupon code to apply, for example SUMMER20.',
      required: false,
    }),
    employee_ids: Property.ShortText({
      displayName: 'Assigned Employee IDs',
      description: 'Comma-separated numeric IDs of store employees to assign, for example 1764372897, 1298199463. Leave empty to keep the assignment unchanged.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const acceptedMethods = sallaUtils.toStringList(propsValue.accepted_methods);
    const employeeIds = sallaUtils.toStringList(propsValue.employee_ids);
    return sallaOrders.updateOrder({
      auth,
      orderId: propsValue.order_id,
      input: {
        customerId: propsValue.customer_id ?? undefined,
        receiver: {
          name: propsValue.receiver_name,
          phone: propsValue.receiver_phone,
          email: propsValue.receiver_email,
          countryCode: propsValue.receiver_country_code,
          notify: sallaUtils.triState(propsValue.receiver_notify),
        },
        deliveryMethod: toDeliveryMethod(propsValue.delivery_method),
        branchId: propsValue.branch_id ?? undefined,
        courierId: propsValue.courier_id ?? undefined,
        shipTo: {
          countryId: propsValue.ship_to_country_id ?? undefined,
          cityId: propsValue.ship_to_city_id ?? undefined,
          districtId: propsValue.ship_to_district_id ?? undefined,
          block: propsValue.ship_to_block,
          streetNumber: propsValue.ship_to_street_number,
          addressLine: propsValue.ship_to_address_line,
          postalCode: propsValue.ship_to_postal_code,
          shortAddress: propsValue.ship_to_short_address,
          buildingNumber: propsValue.ship_to_building_number,
          additionalNumber: propsValue.ship_to_additional_number,
          latitude: propsValue.latitude ?? undefined,
          longitude: propsValue.longitude ?? undefined,
        },
        payment: {
          status: propsValue.payment_status,
          method: propsValue.payment_method,
          storeBankId: propsValue.store_bank_id ?? undefined,
          receiptImagePath: propsValue.receipt_image_url,
          acceptedMethods: acceptedMethods.length > 0 ? acceptedMethods : undefined,
          cashOnDeliveryFee: propsValue.cash_on_delivery_fee ?? undefined,
        },
        couponCode: propsValue.coupon_code,
        employeeIds: employeeIds.length > 0 ? employeeIds : undefined,
      },
    });
  },
});

function toDeliveryMethod(value: unknown): 'shipping' | 'pickup' | undefined {
  if (value === 'shipping' || value === 'pickup') {
    return value;
  }
  return undefined;
}
