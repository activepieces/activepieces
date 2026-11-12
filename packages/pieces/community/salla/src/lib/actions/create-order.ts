import { createAction, Property } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaUtils } from '../common/helpers';
import { AddressInput, ProductLineInput, ReceiverInput, sallaOrders } from '../common/orders';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';

export const createOrderAction = createAction({
  auth: sallaAuth,
  name: 'create_order',
  classification: 'WRITE',
  displayName: 'Create Order',
  description: 'Creates an order for an existing or new customer.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a new Salla order from product IDs or SKUs for an existing customer (by customer ID) or a new one (name and mobile), with payment, delivery and receiver details. Use Update Order to change an order that already exists. Each call creates a separate order, so do not retry blindly.',
    idempotent: false,
  },
  outputSchema: sallaOutputSchemas.order,
  propertyGroups: [
    {
      key: 'customer',
      display: 'section',
      label: 'Customer',
      description: 'Pick an existing customer, or fill the name and mobile of a new one.',
      icon: 'user',
      props: ['customer', 'customer_name', 'customer_mobile', 'customer_email'],
    },
    {
      key: 'products',
      display: 'section',
      label: 'Products',
      icon: 'inbox',
      props: ['products'],
    },
    {
      key: 'delivery',
      display: 'section',
      label: 'Delivery',
      description: 'Needed when a product requires shipping. The address fields are the Saudi National Address.',
      icon: 'send',
      props: ['delivery_method', 'branch', 'courier_id', ...addressPropNames()],
    },
    {
      key: 'payment',
      display: 'section',
      label: 'Payment',
      icon: 'tag',
      props: ['payment_status', 'payment_method', 'accepted_method', 'payment_reference_id', 'receipt_image_url', 'cash_on_delivery_fee'],
    },
    {
      key: 'receiver',
      display: 'section',
      label: 'Receiver',
      description: 'Only when someone other than the customer receives the order.',
      icon: 'send',
      props: ['receiver_name', 'receiver_phone', 'receiver_email', 'receiver_country_code', 'receiver_notify'],
    },
  ],
  props: {
    customer: sallaProps.customer({
      required: false,
      displayName: 'Existing Customer',
      description: 'Search by name or mobile, or map a customer ID such as 1227534533. Leave empty to create the order for a new customer below.',
    }),
    customer_name: Property.ShortText({
      displayName: 'New Customer Name',
      description: 'Full name of a new customer, for example "Sara Alqahtani". Needed when no existing customer is picked.',
      placeholder: 'Sara Alqahtani',
      width: 'half',
      required: false,
    }),
    customer_mobile: Property.ShortText({
      displayName: 'New Customer Mobile',
      description: 'Mobile with country code, for example +966501234567. Needed when no existing customer is picked.',
      placeholder: '+966501234567',
      width: 'half',
      required: false,
    }),
    customer_email: Property.ShortText({
      displayName: 'New Customer Email',
      description: 'Email of a new customer, for example sara@example.com.',
      placeholder: 'sara@example.com',
      required: false,
    }),
    products: Property.Array({
      displayName: 'Products',
      description: 'One row per product. Products with required options or subscription products cannot be added here.',
      required: true,
      properties: {
        identifier_type: Property.StaticDropdown<ProductLineInput['identifierType'], true>({
          displayName: 'Find Product By',
          description: 'Product ID (a number such as 1534264882) or SKU (the store code such as TSHIRT-RED-M).',
          required: true,
          defaultValue: 'id',
          options: {
            options: [
              { label: 'Product ID', value: 'id' },
              { label: 'SKU', value: 'sku' },
            ],
          },
        }),
        identifier: Property.ShortText({
          displayName: 'Product ID or SKU',
          description: 'For example 1534264882 for a product ID, or TSHIRT-RED-M for a SKU.',
          placeholder: '1534264882',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Units to order, a whole number above 0, for example 2.',
          required: true,
          defaultValue: 1,
        }),
      },
    }),
    delivery_method: Property.StaticDropdown<DeliveryMethod, false>({
      displayName: 'Delivery Method',
      description: 'Shipping sends the order to the address below; Pickup needs a branch. Needed when a product requires shipping.',
      width: 'half',
      required: false,
      options: {
        options: [
          { label: 'Shipping', value: 'shipping' },
          { label: 'Pickup from branch', value: 'pickup' },
        ],
      },
    }),
    branch: sallaProps.branch({
      required: false,
      description: 'Branch the customer picks the order up from. Needed when Delivery Method is Pickup.',
    }),
    courier_id: Property.ShortText({
      displayName: 'Courier ID',
      description: 'Numeric ID of the shipping company from Salla\'s Shipping Companies list, for example 1723506348. Needed when Delivery Method is Shipping.',
      placeholder: '1723506348',
      width: 'half',
      required: false,
    }),
    ...orderAddressProps(),
    payment_status: Property.StaticDropdown<PaymentStatus, true>({
      displayName: 'Payment Status',
      description: 'Paid works only with Payment Method Bank transfer or Cash on delivery. Pending payment needs Accepted Payment Method.',
      display: 'cards',
      required: true,
      defaultValue: 'pending_payment',
      options: {
        options: [
          { label: 'Paid', value: 'paid', description: 'The customer has already paid.' },
          { label: 'Pending payment', value: 'pending_payment', description: 'The customer still has to pay.' },
        ],
      },
    }),
    payment_method: Property.StaticDropdown<string, false>({
      displayName: 'Payment Method',
      description: 'How the customer paid. Needed when Payment Status is Paid, and Salla then accepts only Bank transfer or Cash on delivery.',
      width: 'half',
      required: false,
      options: { options: paymentMethodOptions({ includeSubscription: true }) },
    }),
    accepted_method: Property.StaticDropdown<string, false>({
      displayName: 'Accepted Payment Method',
      description: 'How the customer will be allowed to pay. Needed when Payment Status is Pending payment.',
      width: 'half',
      required: false,
      options: { options: paymentMethodOptions({ includeSubscription: false }) },
    }),
    payment_reference_id: Property.ShortText({
      displayName: 'Bank or Subscription ID',
      description: 'Numeric ID of the store bank account (Payment Method Bank transfer) or of the subscription (Payment Method Subscription), for example 1879023422.',
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
      description: 'Name of the person who receives the order, for example "Omar Alharbi".',
      placeholder: 'Omar Alharbi',
      width: 'half',
      required: false,
    }),
    receiver_phone: Property.ShortText({
      displayName: 'Receiver Phone',
      description: 'Receiver mobile with country code, for example +966551234567.',
      placeholder: '+966551234567',
      width: 'half',
      required: false,
    }),
    receiver_email: Property.ShortText({
      displayName: 'Receiver Email',
      description: 'Receiver email, for example omar@example.com.',
      placeholder: 'omar@example.com',
      width: 'half',
      required: false,
    }),
    receiver_country_code: Property.ShortText({
      displayName: 'Receiver Country Code',
      description: 'Two-letter country code of the receiver phone, for example SA.',
      placeholder: 'SA',
      width: 'half',
      required: false,
    }),
    receiver_notify: Property.Checkbox({
      displayName: 'Notify Receiver',
      description: 'Send the receiver the order notifications. Used only when a receiver is filled in.',
      required: false,
      defaultValue: false,
    }),
    coupon_code: Property.ShortText({
      displayName: 'Coupon Code',
      description: 'Store coupon to apply to the order, for example WELCOME10.',
      placeholder: 'WELCOME10',
      advanced: true,
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return sallaOrders.createOrder({
      auth,
      input: {
        customer: {
          id: propsValue.customer ?? undefined,
          name: propsValue.customer_name ?? undefined,
          mobile: propsValue.customer_mobile ?? undefined,
          email: propsValue.customer_email ?? undefined,
        },
        products: readProductLines(propsValue.products),
        deliveryMethod: propsValue.delivery_method ?? undefined,
        branchId: propsValue.branch ?? undefined,
        courierId: propsValue.courier_id ?? undefined,
        shipTo: readAddress(propsValue),
        payment: {
          status: propsValue.payment_status,
          method: propsValue.payment_method ?? undefined,
          acceptedMethod: propsValue.accepted_method ?? undefined,
          referenceId: propsValue.payment_reference_id ?? undefined,
          receiptImagePath: propsValue.receipt_image_url ?? undefined,
          cashOnDeliveryFee: propsValue.cash_on_delivery_fee ?? undefined,
        },
        receiver: readCreateReceiver({ values: propsValue, notify: propsValue.receiver_notify === true }),
        couponCode: propsValue.coupon_code ?? undefined,
      },
    });
  },
});

export function orderAddressProps() {
  return {
    country_id: Property.Number({
      displayName: 'Country ID',
      description: 'Numeric Salla country ID from the Countries list (a Salla number, not an ISO code). Needed for a shipping address.',
            width: 'half',
      required: false,
    }),
    city_id: Property.Number({
      displayName: 'City ID',
      description: 'Numeric Salla city ID from the Cities list of that country. Needed for Shipping.',
      width: 'half',
      required: false,
    }),
    district_id: Property.Number({
      displayName: 'District ID',
      description: 'Numeric Salla district ID from the Districts list of that city. Required for a shipping address.',
      width: 'half',
      required: false,
    }),
    block: Property.ShortText({
      displayName: 'Block (Neighborhood)',
      description: 'Neighborhood name, for example Al Olaya. Required for a shipping address.',
      placeholder: 'Al Olaya',
      width: 'half',
      required: false,
    }),
    street_number: Property.ShortText({
      displayName: 'Street',
      description: 'Street name or number, for example King Fahd Road. Required for a shipping address.',
      placeholder: 'King Fahd Road',
      width: 'half',
      required: false,
    }),
    building_number: Property.ShortText({
      displayName: 'Building Number',
      description: 'Four-digit National Address building number, for example 8228. Required for Saudi (KSA) addresses and whenever Update Order changes the address.',
      placeholder: '8228',
      width: 'half',
      required: false,
    }),
    address_line: Property.ShortText({
      displayName: 'Address Line',
      description: 'Full street address, for example "8228 King Fahd Road, Al Olaya, Riyadh 12214". Needed for Shipping.',
      placeholder: '8228 King Fahd Road, Al Olaya, Riyadh 12214',
      required: false,
    }),
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Five-digit postal code, for example 12214. Required for a shipping address.',
      placeholder: '12214',
      width: 'half',
      required: false,
    }),
    additional_number: Property.ShortText({
      displayName: 'Additional Number',
      description: 'Four-digit National Address additional number, for example 2121. Required for Saudi (KSA) addresses and whenever Update Order changes the address.',
      placeholder: '2121',
      width: 'half',
      required: false,
    }),
    short_address: Property.ShortText({
      displayName: 'Short Address',
      description: 'Eight-character National Address short code, four letters and four digits, for example RHMA3184. Required for a shipping address.',
      placeholder: 'RHMA3184',
      width: 'half',
      required: false,
    }),
    latitude: Property.Number({
      displayName: 'Latitude',
      description: 'Delivery point latitude in decimal degrees, for example 24.7136. Required for a shipping address.',
      placeholder: '24.7136',
      width: 'half',
      required: false,
    }),
    longitude: Property.Number({
      displayName: 'Longitude',
      description: 'Delivery point longitude in decimal degrees, for example 46.6753. Required for a shipping address.',
      placeholder: '46.6753',
      width: 'half',
      required: false,
    }),
  };
}

export function addressPropNames(): string[] {
  return Object.keys(orderAddressProps());
}

export function readAddress(values: AddressFormValues): AddressInput {
  return {
    countryId: values.country_id ?? undefined,
    cityId: values.city_id ?? undefined,
    districtId: values.district_id ?? undefined,
    block: values.block ?? undefined,
    streetNumber: values.street_number ?? undefined,
    addressLine: values.address_line ?? undefined,
    postalCode: values.postal_code ?? undefined,
    shortAddress: values.short_address ?? undefined,
    buildingNumber: values.building_number ?? undefined,
    additionalNumber: values.additional_number ?? undefined,
    latitude: values.latitude ?? undefined,
    longitude: values.longitude ?? undefined,
  };
}

export function readReceiver({ values, notify }: { values: ReceiverFormValues; notify: boolean | undefined }): ReceiverInput | undefined {
  const receiver: ReceiverInput = {
    name: values.receiver_name ?? undefined,
    phone: values.receiver_phone ?? undefined,
    email: values.receiver_email ?? undefined,
    countryCode: values.receiver_country_code ?? undefined,
  };
  const hasDetails = Object.values(receiver).some((value) => typeof value === 'string' && value.trim().length > 0);
  if (!hasDetails && notify === undefined) {
    return undefined;
  }
  return { ...receiver, notify };
}

export function paymentMethodOptions({ includeSubscription }: { includeSubscription: boolean }): Array<{ label: string; value: string }> {
  const options = [
    { label: 'Credit card', value: 'credit_card' },
    { label: 'Mada', value: 'mada' },
    { label: 'Bank transfer', value: 'bank' },
    { label: 'Cash on delivery', value: 'cod' },
  ];
  return includeSubscription ? [...options, { label: 'Subscription', value: 'subscription' }] : options;
}

function readCreateReceiver({ values, notify }: { values: ReceiverFormValues; notify: boolean }): ReceiverInput | undefined {
  const receiver = readReceiver({ values, notify: undefined });
  return receiver ? { ...receiver, notify } : undefined;
}

function readIdentifierType({ value, line }: { value: unknown; line: number }): 'id' | 'sku' {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : value;
  if (text === undefined || text === null || text === '' || text === 'id') {
    return 'id';
  }
  if (text === 'sku') {
    return 'sku';
  }
  throw new Error(`Product row ${line}: Find Product By must be id or sku, but got "${String(value)}".`);
}

function readProductLines(rows: unknown): ProductLineInput[] {
  return sallaUtils.toRecordList({ value: rows, label: 'Products' }).map((row, index) => {
    if (typeof row !== 'object' || row === null) {
      throw new Error(`Product row ${index + 1} is empty. Fill the product ID or SKU and the quantity.`);
    }
    const identifierType = Reflect.get(row, 'identifier_type');
    const identifier = Reflect.get(row, 'identifier');
    const quantity = Reflect.get(row, 'quantity');
    return {
      identifierType: readIdentifierType({ value: identifierType, line: index + 1 }),
      identifier: typeof identifier === 'number' || typeof identifier === 'string' ? identifier : '',
      quantity: typeof quantity === 'number' || typeof quantity === 'string' ? quantity : undefined,
    };
  });
}


type DeliveryMethod = 'shipping' | 'pickup';

type PaymentStatus = 'paid' | 'pending_payment';

type Nullable<T> = T | null | undefined;

type AddressFormValues = {
  country_id?: Nullable<number>;
  city_id?: Nullable<number>;
  district_id?: Nullable<number>;
  block?: Nullable<string>;
  street_number?: Nullable<string>;
  address_line?: Nullable<string>;
  postal_code?: Nullable<string>;
  short_address?: Nullable<string>;
  building_number?: Nullable<string>;
  additional_number?: Nullable<string>;
  latitude?: Nullable<number>;
  longitude?: Nullable<number>;
};

type ReceiverFormValues = {
  receiver_name?: Nullable<string>;
  receiver_phone?: Nullable<string>;
  receiver_email?: Nullable<string>;
  receiver_country_code?: Nullable<string>;
};

export type { AddressFormValues, ReceiverFormValues, DeliveryMethod, PaymentStatus };
