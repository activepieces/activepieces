export type ShopifyAuth = {
  shopName: string;
  adminToken: string;
};

export type ShopifyCustomer = {
  id: number;
  email: string;
  accepts_marketing: boolean;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  orders_count: number;
  state: string;
  total_spent: number;
  last_order_id: number;
  note: unknown;
  verified_email: boolean;
  tax_exempt: boolean;
  tags: string;
  last_order_name: unknown;
  currency: string;
  phone: string;
  addresses: unknown[];
  accepts_marketing_updated_at: string;
  marketing_opt_in_level: unknown;
  tax_exemptions: unknown[];
  email_marketing_consent: unknown;
  sms_marketing_consent: unknown;
  send_email_invite: boolean;
};

export type ShopifyOrder = {
  line_items: Partial<ShopifyLineItem>[];
  customer: Partial<ShopifyCustomer>;
  financial_status: ShopifyOrderFinancialStatuses;
  email: string;
  send_receipt: boolean;
  send_fulfillment_receipt: boolean;
  fulfillment_status: string;
  tags: string;
  phone: string;
  note: string;
};

export type ShopifyAddress = {
  first_name: string;
  address1: string;
  phone: string;
  city: string;
  zip: string;
  province: string;
  country: string;
  last_name: string;
  address2: string;
  company: unknown;
  latitude: number;
  longitude: number;
  name: string;
  country_code: string;
  province_code: string;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  body_html: string;
  vendor: string;
  product_type: string;
  status: ShopifyProductStatuses;
  tags: string;
  images: Partial<ShopifyImage>[];
  created_at: string;
  updated_at: string;
};

export type ShopifyImage = {
  src: string;
  attachment: string;
  position: number;
};

export type ShopifyProductVariant = {
  id: number;
  product_id: number;
  title: string;
  price: string;
  sku: string;
  inventory_item_id: number;
  inventory_quantity: number;
  created_at: string;
  updated_at: string;
  [key: string]: string | number | unknown;
};

export type ShopifyLineItem = {
  variant_id: number;
  product_id: number;
  quantity: number;
  price: string;
  title: string;
};

export type ShopifyDraftOrder = ShopifyOrder;

export type ShopifyTransaction = {
  order_id: number;
  currency: string;
  amount: string;
  source: string;
  kind: ShopifyTransactionKinds;
  parent_id: number;
  test: boolean;
};

export type ShopifyFulfillment = {
  order_id: number;
  status: ShopifyFulfillmentStatuses;
  line_items: Partial<ShopifyLineItem>[];
};

export type ShopifyFulfillmentEvent = {
  id: number;
  order_id: number;
  status: ShopifyFulfillmentEventStatuses;
  message: string;
};

export type ShopifyCollect = {
  product_id: number;
  collection_id: number;
};

export type ShopifyCheckout = {
  id: number;
  abandoned_checkout_url: string;
  completed_at: string;
  created_at: string;
  currency: string;
  customer: Partial<ShopifyCustomer>;
};

export enum ShopifyProductStatuses {
  ACTIVE = 'active',
  ARCHIVED = 'archived',
  DRAFT = 'draft',
}

export enum ShopifyOrderFinancialStatuses {
  PENDING = 'pending',
  PARTIALLY_PAID = 'partially_pad',
}

export enum ShopifyTransactionKinds {
  AUTHORIZATION = 'authorization',
  SALE = 'sale',
  CAPTURE = 'capture',
  VOID = 'void',
  REFUND = 'refund',
}

export enum ShopifyFulfillmentStatuses {
  PENDING = 'pending',
  OPEN = 'open',
  SUCCESS = 'success',
  CANCELLED = 'cancelled',
  ERROR = 'error',
  FAILURE = 'failure',
}

export enum ShopifyFulfillmentEventStatuses {
  ATTEMPTED_DELIVERY = 'attempted_delivery',
  CARRIER_PICKED_UP = 'carrier_picked_up',
  CONFIRMED = 'confirmed',
  DELAYED = 'delayed',
  DELIVERED = 'delivered',
  FAILURE = 'failure',
  IN_TRANSIT = 'in_transit',
  LABEL_PRINTED = 'label_printed',
  LABEL_PURCHASED = 'label_purchased',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  PICKED_UP = 'picked_up',
  READY_FOR_PICKUP = 'ready_for_pickup',
}
