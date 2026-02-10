export interface ShippoConfig {
  apiToken: string;
}

export interface Address {
  name: string;
  company?: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
  email?: string;
}

export interface Parcel {
  length: number;
  width: number;
  height: number;
  distance_unit: 'in' | 'cm';
  weight: number;
  mass_unit: 'lb' | 'kg';
}

export interface Order {
  object_id?: string;
  order_number: string;
  order_status: 'PAID' | 'UNPAID' | 'CANCELLED' | 'REFUNDED' | 'ONHOLD';
  placed_at: string;
  from_address: Address;
  to_address: Address;
  line_items: LineItem[];
  total_price: string;
  total_tax?: string;
  currency: string;
  weight?: string;
  weight_unit?: string;
  shipping_cost?: string;
  shipping_cost_currency?: string;
  object_created?: string;
  object_updated?: string;
}

export interface LineItem {
  title: string;
  sku?: string;
  quantity: number;
  total_price: string;
  currency: string;
  weight?: string;
  weight_unit?: string;
}

export interface CreateOrderRequest {
  order_number: string;
  order_status: 'PAID' | 'UNPAID' | 'CANCELLED' | 'REFUNDED' | 'ONHOLD';
  placed_at: string;
  total_price: string;
  currency: string;
  from_address: Address;
  to_address: Address;
  line_items: LineItem[];
  total_tax?: string;
  weight?: string;
  weight_unit?: string;
  shipping_cost?: string;
  shipping_cost_currency?: string;
}

export interface ShippingLabel {
  object_id: string;
  object_owner: string;
  carrier_account: string;
  servicelevel_token: string;
  tracking_number: string;
  tracking_status: string;
  tracking_url_provider: string;
  label_url: string;
  rate: string;
  parcel: string;
  address_from: Address;
  address_to: Address;
  metadata?: string;
  test: boolean;
  created_at: string;
  object_created: string;
}

export interface ApiListResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}