import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaUtils } from '../../common/helpers';
import { ProductLineInput, sallaOrders } from '../../common/orders';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiCreateOrderAction = createAction({
  auth: sallaAuth,
  name: 'ai_create_order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Creates a new order for an existing or new customer.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Salla order for an existing customer (customer_id) or a new one (customer_name + customer_mobile), with one or more products by product ID or SKU. Use Update Order to change an existing order and Update Order Status to move it along; get branch_id from List Branches. Each call creates a separate order, so a retry creates a duplicate.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.order,
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Numeric ID of an existing Salla customer, for example 1209983424. Leave empty to create the order for a new customer with customer_name and customer_mobile.',
      required: false,
    }),
    customer_name: Property.ShortText({
      displayName: 'Customer Name',
      description: 'Full name of a new customer, for example Sara Al-Qahtani. Required when customer_id is empty.',
      required: false,
    }),
    customer_mobile: Property.ShortText({
      displayName: 'Customer Mobile',
      description: 'Mobile number of a new customer in international format, for example +966500000000. Required when customer_id is empty.',
      required: false,
    }),
    customer_email: Property.ShortText({
      displayName: 'Customer Email',
      description: 'Email of a new customer, for example sara@example.com. Used only when customer_id is empty.',
      required: false,
    }),
    products: Property.Array({
      displayName: 'Products',
      description:
        'One entry per product line, for example [{"identifier_type":"sku","identifier":"TSHIRT-RED-M","quantity":2},{"identifier_type":"id","identifier":"515303061","quantity":1}]. identifier_type is id (numeric Salla product ID) or sku; quantity defaults to 1.',
      required: true,
      properties: {
        identifier_type: Property.StaticDropdown({
          displayName: 'Identifier Type',
          description: 'id when identifier is the numeric Salla product ID, sku when it is the product SKU.',
          required: true,
          options: {
            disabled: false,
            options: [
              { label: 'Product ID', value: 'id' },
              { label: 'SKU', value: 'sku' },
            ],
          },
        }),
        identifier: Property.ShortText({
          displayName: 'Identifier',
          description: 'The product ID (for example 515303061) or SKU (for example TSHIRT-RED-M).',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Number of units, greater than 0, for example 2. Default 1.',
          required: false,
        }),
      },
    }),
    payment_status: Property.StaticDropdown({
      displayName: 'Payment Status',
      description: 'paid when the customer already paid (then set payment_method to bank or cod; Salla accepts paid only with those two), pending_payment when Salla should wait for payment (then set accepted_method, which is required).',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Paid', value: 'paid' },
          { label: 'Pending Payment', value: 'pending_payment' },
        ],
      },
    }),
    payment_method: Property.StaticDropdown({
      displayName: 'Payment Method',
      description: 'How the order was paid: credit_card, mada, bank, cod or subscription. Required when payment_status is paid, and then it must be bank or cod.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Credit Card', value: 'credit_card' },
          { label: 'Mada', value: 'mada' },
          { label: 'Bank Transfer', value: 'bank' },
          { label: 'Cash on Delivery', value: 'cod' },
          { label: 'Subscription', value: 'subscription' },
        ],
      },
    }),
    accepted_method: Property.StaticDropdown({
      displayName: 'Accepted Payment Method',
      description: 'Payment method the customer may use to pay later: credit_card, mada, bank or cod. Required when payment_status is pending_payment.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Credit Card', value: 'credit_card' },
          { label: 'Mada', value: 'mada' },
          { label: 'Bank Transfer', value: 'bank' },
          { label: 'Cash on Delivery', value: 'cod' },
        ],
      },
    }),
    payment_reference_id: Property.Number({
      displayName: 'Bank or Subscription ID',
      description: 'Required when payment_method is bank (the store bank account ID, for example 234234) or subscription (the subscription ID).',
      required: false,
    }),
    receipt_image_url: Property.ShortText({
      displayName: 'Receipt Image URL',
      description: 'Public URL of the bank transfer receipt, for example https://cdn.example.com/receipts/41027662.jpg. Required when payment_method is bank.',
      required: false,
    }),
    cash_on_delivery_fee: Property.Number({
      displayName: 'Cash on Delivery Fee',
      description: 'Optional fee for cash on delivery, for example 10. Used only when payment_method is cod. Leave empty for no fee. The store currency is used automatically.',
      required: false,
    }),
    delivery_method: Property.StaticDropdown({
      displayName: 'Delivery Method',
      description: 'shipping (then set courier_id and every ship_to_* field) or pickup (then set branch_id). Required when any product needs shipping.',
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
      displayName: 'Pickup Branch ID',
      description: 'Numeric branch ID from List Branches, for example 999858679. Required when delivery_method is pickup.',
      required: false,
    }),
    courier_id: Property.ShortText({
      displayName: 'Courier ID',
      description: 'Numeric ID of the store\'s shipping company, for example 1433878184. Required when delivery_method is shipping.',
      required: false,
    }),
    ship_to_country_id: Property.Number({
      displayName: 'Ship To Country ID',
      description: 'Salla country ID (a Salla number, not an ISO code). Required for shipping.',
      required: false,
    }),
    ship_to_city_id: Property.Number({
      displayName: 'Ship To City ID',
      description: 'Salla city ID, for example 1939592358. Required for shipping.',
      required: false,
    }),
    ship_to_district_id: Property.Number({
      displayName: 'Ship To District ID',
      description: 'Salla district ID, for example 1939592358. Required for shipping.',
      required: false,
    }),
    ship_to_block: Property.ShortText({
      displayName: 'Ship To Block',
      description: 'Neighbourhood or block name, for example Al Olaya. Required for shipping.',
      required: false,
    }),
    ship_to_street_number: Property.ShortText({
      displayName: 'Ship To Street Number',
      description: 'Street number or name, for example 8230. Required for shipping.',
      required: false,
    }),
    ship_to_address_line: Property.ShortText({
      displayName: 'Ship To Address Line',
      description: 'Full street address, for example 7124 Prince Sultan Road, Al Olaya, Riyadh. Required for shipping.',
      required: false,
    }),
    ship_to_postal_code: Property.ShortText({
      displayName: 'Ship To Postal Code',
      description: 'Postal code, 5 digits in Saudi Arabia, for example 12211. Required for shipping.',
      required: false,
    }),
    ship_to_short_address: Property.ShortText({
      displayName: 'Ship To Short Address',
      description: 'Saudi National Address short code, 4 letters and 4 digits, for example JCMA3429. Required for Saudi addresses.',
      required: false,
    }),
    ship_to_building_number: Property.ShortText({
      displayName: 'Ship To Building Number',
      description: 'Saudi National Address building number, 4 digits, for example 7124. Required for Saudi addresses.',
      required: false,
    }),
    ship_to_additional_number: Property.ShortText({
      displayName: 'Ship To Additional Number',
      description: 'Saudi National Address additional number, 4 digits, for example 6558. Required for Saudi addresses.',
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
    receiver_name: Property.ShortText({
      displayName: 'Receiver Name',
      description: 'Name of the person receiving the order when it is not the customer, for example Ahmed Al-Harbi.',
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
      description: 'yes tells Salla to notify the receiver about the order, no does not, default sends nothing and keeps Salla\'s default. Default default.',
      required: false,
      defaultValue: 'default',
      options: {
        disabled: false,
        options: [
          { label: 'Salla default', value: 'default' },
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
    coupon_code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'Store coupon code to apply, for example SUMMER20.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.createOrder({
      auth,
      input: {
        customer: {
          id: propsValue.customer_id ?? undefined,
          name: propsValue.customer_name,
          mobile: propsValue.customer_mobile,
          email: propsValue.customer_email,
        },
        products: toProductLines(propsValue.products),
        payment: {
          status: toPaymentStatus(propsValue.payment_status),
          method: propsValue.payment_method,
          acceptedMethod: propsValue.accepted_method,
          referenceId: propsValue.payment_reference_id ?? undefined,
          receiptImagePath: propsValue.receipt_image_url,
          cashOnDeliveryFee: propsValue.cash_on_delivery_fee ?? undefined,
        },
        deliveryMethod: toDeliveryMethod(propsValue.delivery_method),
        branchId: propsValue.branch_id ?? undefined,
        courierId: propsValue.courier_id,
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
        receiver: {
          name: propsValue.receiver_name,
          phone: propsValue.receiver_phone,
          email: propsValue.receiver_email,
          countryCode: propsValue.receiver_country_code,
          notify: sallaUtils.triState(propsValue.receiver_notify),
        },
        couponCode: propsValue.coupon_code,
      },
    });
  },
});

function toProductLines(value: unknown): ProductLineInput[] {
  const entries = sallaUtils.toRecordList({ value, label: 'products' });
  return entries.map((entry, index) => {
    if (!sallaApi.isRecord(entry)) {
      throw new Error(
        `Product line ${index + 1} must be an object such as {"identifier_type":"sku","identifier":"TSHIRT-RED-M","quantity":2}.`,
      );
    }
    const identifier = entry['identifier'];
    const quantity = entry['quantity'];
    return {
      identifierType: toIdentifierType({ value: entry['identifier_type'], line: index + 1 }),
      identifier: typeof identifier === 'string' || typeof identifier === 'number' ? identifier : '',
      quantity: typeof quantity === 'string' || typeof quantity === 'number' ? quantity : undefined,
    };
  });
}

function toIdentifierType({ value, line }: { value: unknown; line: number }): 'id' | 'sku' {
  if (value === undefined || value === null || value === '' || value === 'id') {
    return 'id';
  }
  if (value === 'sku') {
    return 'sku';
  }
  throw new Error(`Product line ${line}: identifier_type must be id or sku, but got "${String(value)}".`);
}

function toPaymentStatus(value: unknown): 'paid' | 'pending_payment' {
  if (value === 'paid' || value === 'pending_payment') {
    return value;
  }
  throw new Error(`payment_status must be paid or pending_payment, but got "${String(value ?? '')}".`);
}

function toDeliveryMethod(value: unknown): 'shipping' | 'pickup' | undefined {
  if (value === 'shipping' || value === 'pickup') {
    return value;
  }
  return undefined;
}
