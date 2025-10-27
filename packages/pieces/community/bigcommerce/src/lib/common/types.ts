export interface BigCommerceCustomer {
  id?: number;
  company?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_created?: string;
  date_modified?: string;
  store_credit_amounts?: Array<{
    amount: number;
  }>;
  registration_ip_address?: string;
  customer_group_id?: number;
  notes?: string;
  tax_exempt_category?: string;
  accepts_product_review_abandoned_cart_emails?: boolean;
  addresses?: BigCommerceAddress[];
  attributes?: Array<{
    attribute_id: number;
    attribute_value: string;
  }>;
}

export interface BigCommerceAddress {
  id?: number;
  customer_id?: number;
  first_name?: string;
  last_name?: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state_or_province: string;
  postal_code: string;
  country_code: string;
  phone?: string;
  address_type?: string;
}

export interface BigCommerceProduct {
  id?: number;
  name: string;
  type?: string;
  sku?: string;
  description?: string;
  weight?: number;
  width?: number;
  depth?: number;
  height?: number;
  price?: number;
  cost_price?: number;
  retail_price?: number;
  sale_price?: number;
  map_price?: number;
  tax_class_id?: number;
  product_tax_code?: string;
  calculated_price?: number;
  categories?: number[];
  brand_id?: number;
  option_set_id?: number;
  option_set_display?: string;
  inventory_level?: number;
  inventory_warning_level?: number;
  inventory_tracking?: string;
  reviews_rating_sum?: number;
  reviews_count?: number;
  total_sold?: number;
  fixed_cost_shipping_price?: number;
  is_free_shipping?: boolean;
  is_visible?: boolean;
  is_featured?: boolean;
  related_products?: number[];
  warranty?: string;
  bin_picking_number?: string;
  layout_file?: string;
  upc?: string;
  mpn?: string;
  gtin?: string;
  search_keywords?: string;
  availability?: string;
  availability_description?: string;
  gift_wrapping_options_type?: string;
  gift_wrapping_options_list?: number[];
  sort_order?: number;
  condition?: string;
  is_condition_shown?: boolean;
  order_quantity_minimum?: number;
  order_quantity_maximum?: number;
  page_title?: string;
  meta_keywords?: string[];
  meta_description?: string;
  date_created?: string;
  date_modified?: string;
  view_count?: number;
  preorder_release_date?: string;
  preorder_message?: string;
  is_preorder_only?: boolean;
  is_price_hidden?: boolean;
  price_hidden_label?: string;
  custom_url?: {
    url: string;
    is_customized: boolean;
  };
  base_variant_id?: number;
  open_graph_type?: string;
  open_graph_title?: string;
  open_graph_description?: string;
  open_graph_use_meta_description?: boolean;
  open_graph_use_product_name?: boolean;
  open_graph_use_image?: boolean;
}

export interface BigCommerceOrder {
  id?: number;
  customer_id?: number;
  date_created?: string;
  date_modified?: string;
  date_shipped?: string;
  status_id?: number;
  status?: string;
  subtotal_ex_tax?: string;
  subtotal_inc_tax?: string;
  subtotal_tax?: string;
  base_shipping_cost?: string;
  shipping_cost_ex_tax?: string;
  shipping_cost_inc_tax?: string;
  shipping_cost_tax?: string;
  shipping_cost_tax_class_id?: number;
  base_handling_cost?: string;
  handling_cost_ex_tax?: string;
  handling_cost_inc_tax?: string;
  handling_cost_tax?: string;
  handling_cost_tax_class_id?: number;
  base_wrapping_cost?: string;
  wrapping_cost_ex_tax?: string;
  wrapping_cost_inc_tax?: string;
  wrapping_cost_tax?: string;
  wrapping_cost_tax_class_id?: number;
  total_ex_tax?: string;
  total_inc_tax?: string;
  total_tax?: string;
  items_total?: number;
  items_shipped?: number;
  payment_method?: string;
  payment_provider_id?: string;
  payment_status?: string;
  refunded_amount?: string;
  order_is_digital?: boolean;
  store_credit_amount?: string;
  gift_certificate_amount?: string;
  ip_address?: string;
  geoip_country?: string;
  geoip_country_iso2?: string;
  currency_id?: number;
  currency_code?: string;
  currency_exchange_rate?: string;
  default_currency_id?: number;
  default_currency_code?: string;
  staff_notes?: string;
  customer_message?: string;
  discount_amount?: string;
  coupon_discount?: string;
  shipping_address_count?: number;
  is_deleted?: boolean;
  ebay_order_id?: string;
  cart_id?: string;
  billing_address?: BigCommerceAddress;
  is_email_opt_in?: boolean;
  credit_card_type?: string;
  order_source?: string;
  channel_id?: number;
  external_source?: string;
  products?: {
    url: string;
    resource: string;
  };
  shipping_addresses?: {
    url: string;
    resource: string;
  };
  coupons?: {
    url: string;
    resource: string;
  };
}

export interface BigCommerceCart {
  id?: string;
  customer_id?: number;
  channel_id?: number;
  email?: string;
  currency?: {
    code: string;
  };
  tax_included?: boolean;
  base_amount?: number;
  discount_amount?: number;
  cart_amount?: number;
  coupons?: Array<{
    code: string;
    id: number;
    coupon_type: string;
    discounted_amount: number;
  }>;
  discounts?: Array<{
    id: number;
    discounted_amount: number;
  }>;
  line_items?: {
    physical_items?: Array<{
      id: string;
      parent_id?: string;
      variant_id: number;
      product_id: number;
      sku: string;
      name: string;
      url: string;
      quantity: number;
      taxable: boolean;
      image_url: string;
      discounts: Array<{
        id: number;
        discounted_amount: number;
      }>;
      coupons: Array<{
        code: string;
        id: number;
        coupon_type: string;
        discounted_amount: number;
      }>;
      discount_amount: number;
      coupon_amount: number;
      list_price: number;
      sale_price: number;
      extended_list_price: number;
      extended_sale_price: number;
      is_require_shipping: boolean;
      is_mutable: boolean;
    }>;
    digital_items?: Array<{
      id: string;
      parent_id?: string;
      variant_id: number;
      product_id: number;
      sku: string;
      name: string;
      url: string;
      quantity: number;
      taxable: boolean;
      image_url: string;
      discounts: Array<{
        id: number;
        discounted_amount: number;
      }>;
      coupons: Array<{
        code: string;
        id: number;
        coupon_type: string;
        discounted_amount: number;
      }>;
      discount_amount: number;
      coupon_amount: number;
      list_price: number;
      sale_price: number;
      extended_list_price: number;
      extended_sale_price: number;
      download_file_urls: string[];
      download_page_url: string;
      download_size: string;
      is_mutable: boolean;
    }>;
    gift_certificates?: Array<{
      id: string;
      name: string;
      theme: string;
      amount: number;
      taxable: boolean;
      sender: {
        name: string;
        email: string;
      };
      recipient: {
        name: string;
        email: string;
      };
      message: string;
    }>;
    custom_items?: Array<{
      id: string;
      sku: string;
      name: string;
      quantity: number;
      list_price: number;
    }>;
  };
  created_time?: string;
  updated_time?: string;
  locale?: string;
}

export interface BigCommerceBlogPost {
  id?: number;
  title: string;
  url?: string;
  preview_url?: string;
  body: string;
  summary?: string;
  tags?: string[];
  is_published?: boolean;
  published_date?: {
    timezone_type: number;
    date: string;
  };
  published_date_iso8601?: string;
  meta_description?: string;
  meta_keywords?: string;
  author?: string;
  thumbnail_path?: string;
}