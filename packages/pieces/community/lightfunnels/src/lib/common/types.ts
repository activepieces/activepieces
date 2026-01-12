export type Address = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  line1: string;
  line2: string;
  country: string;
  city: string;
  area: string;
  zip: string;
  state: string;
};

export type OrderCustomer = {
  id: string;
  full_name: string;
  avatar: string;
  location: string;
};

export type OrderItemOption = {
  id: string;
  label: string;
  value: string;
};

export type OrderItem = {
  __typename: "VariantSnapshot";
  product_id: string;
  id: string;
  _id: number;
  image: { path: string; } | null;
  file?: { id: string; path?: string; } | null;
  customer_files: Array<Record<string, unknown>>;
  title: string;
  price: number;
  variant_id: string;
  fulfillment_status: string;
  carrier: string;
  tracking_number: string | null;
  tracking_link: string | null;
  refund_id: string | null;
  payment_id: string | null;
  removed_at: string | null;
  sku: string;
  custom_options: Array<Record<string, unknown>>;
  options: OrderItemOption[];
};

export type PaymentBundleSnapshot = {
  id: string;
  value: number;
  discount_result: number;
  label: string;
  offer_id: string | null;
};

export type OrderRefund = {
  id: string;
  _id: number;
  amount: number;
  reason: string;
};

export type OrderPayment = {
  id: string;
  _id: number;
  total: number;
  sub_total: number;
  created_at: string;
  refunded: number;
  refundable: number;
  price_bundle_snapshot: PaymentBundleSnapshot[];
  discount_snapshot: Record<string, unknown> | null;
  refunds: OrderRefund[];
  source: {
    payment_gateway: {
      prototype: {
        key: string;
      };
    };
  };
  cookies: Record<string, unknown>;
};

export type Order = {
  id: string;
  __typename: "Order";
  _id: number;
  total: number;
  account_id: string;
  subtotal: number;
  discount_value: number;
  normal_discount_value: number;
  bundle_discount_value: number;
  pm_discount_value: number;
  pm_extra_fees: number;
  name: string;
  notes: string;
  email: string;
  phone: string;
  archived_at: string | null;
  refunded_amount: number;
  paid_by_customer: number;
  net_payment: number;
  original_total: number;
  refundable: number;
  created_at: string;
  cancelled_at: string | null;
  test: boolean;
  tags: string[];
  shipping: number;
  shipping_discount: number;
  funnel_id: string;
  store_id: string | null;
  customer: OrderCustomer;
  custom: Record<string, unknown>;
  items: OrderItem[];
  payments: OrderPayment[];
  shipping_address: Address;
  billing_address: Address;
  client_details: {
    ip: string;
    [key: string]: unknown;
  };
  utm: Record<string, unknown> | null;
  currency: string;
  link?: string | null;
  thank_you_url?: string | null;
};

export type OrderWebhookPayload = {
  node: Order;
};
