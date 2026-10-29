import { FieldFormat, OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';


type Spec = [key: string, label: string, format?: FieldFormat, description?: string];
const CENTS = 'In cents (smallest currency unit).';

const fields = (specs: Spec[]): OutputSchemaField[] =>
  specs.map(([key, label, format, description]) => ({
    key,
    label,
    ...(format ? { format } : {}),
    ...(description ? { description } : {}),
  }));

const timestamps: Spec[] = [
  ['created_at', 'Created At', 'datetime'],
  ['updated_at', 'Updated At', 'datetime'],
];
const testMode: Spec = ['test_mode', 'Test Mode', 'boolean'];

const storeSpecs: Spec[] = [
  ['name', 'Name'],
  ['slug', 'Slug'],
  ['domain', 'Domain'],
  ['url', 'URL', 'url'],
  ['avatar_url', 'Avatar URL', 'image'],
  ['plan', 'Plan'],
  ['country', 'Country'],
  ['country_nicename', 'Country Name'],
  ['currency', 'Currency'],
  ['total_sales', 'Total Sales', 'number'],
  ['total_revenue', 'Total Revenue', 'number', CENTS],
  ['thirty_day_sales', '30-Day Sales', 'number'],
  ['thirty_day_revenue', '30-Day Revenue', 'number', CENTS],
  ...timestamps,
];

const customerSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['name', 'Name'],
  ['email', 'Email', 'email'],
  ['status', 'Status', undefined, 'subscribed, unsubscribed, archived, requires_verification, invalid_email or bounced.'],
  ['status_formatted', 'Status (Formatted)'],
  ['city', 'City'],
  ['region', 'Region'],
  ['country', 'Country'],
  ['country_formatted', 'Country (Formatted)'],
  ['total_revenue_currency', 'Total Revenue', 'number', CENTS],
  ['total_revenue_currency_formatted', 'Total Revenue (Formatted)'],
  ['mrr', 'MRR', 'number', CENTS],
  ['mrr_formatted', 'MRR (Formatted)'],
  ...timestamps,
  testMode,
];
const customerUrls: OutputSchemaField = { key: 'urls', label: 'URLs', children: fields([['customer_portal', 'Customer Portal', 'url']]) };

const orderItemSpecs: Spec[] = [
  ['order_id', 'Order ID', 'number'],
  ['product_id', 'Product ID', 'number'],
  ['variant_id', 'Variant ID', 'number'],
  ['price_id', 'Price ID', 'number'],
  ['product_name', 'Product Name'],
  ['variant_name', 'Variant Name'],
  ['price', 'Price', 'number', CENTS],
  ['quantity', 'Quantity', 'number'],
  ...timestamps,
  testMode,
];

const orderSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['customer_id', 'Customer ID', 'number'],
  ['identifier', 'Identifier'],
  ['order_number', 'Order Number', 'number'],
  ['user_name', 'Customer Name'],
  ['user_email', 'Customer Email', 'email'],
  ['currency', 'Currency'],
  ['currency_rate', 'Currency Rate'],
  ['subtotal', 'Subtotal', 'number', CENTS],
  ['setup_fee', 'Setup Fee', 'number', CENTS],
  ['discount_total', 'Discount Total', 'number', CENTS],
  ['tax', 'Tax', 'number', CENTS],
  ['total', 'Total', 'number', CENTS],
  ['refunded_amount', 'Refunded Amount', 'number', CENTS],
  ['subtotal_usd', 'Subtotal (USD cents)', 'number'],
  ['discount_total_usd', 'Discount Total (USD cents)', 'number'],
  ['tax_usd', 'Tax (USD cents)', 'number'],
  ['total_usd', 'Total (USD cents)', 'number'],
  ['refunded_amount_usd', 'Refunded Amount (USD cents)', 'number'],
  ['setup_fee_usd', 'Setup Fee (USD cents)', 'number'],
  ['setup_fee_formatted', 'Setup Fee (Formatted)'],
  ['affiliate_id', 'Affiliate ID', 'number'],
  ['referral_amount', 'Referral Amount', 'number', CENTS],
  ['tax_name', 'Tax Name'],
  ['tax_rate', 'Tax Rate'],
  ['tax_inclusive', 'Tax Inclusive', 'boolean'],
  ['status', 'Status', undefined, 'pending, failed, paid, refunded, partial_refund or fraudulent.'],
  ['status_formatted', 'Status (Formatted)'],
  ['refunded', 'Refunded', 'boolean'],
  ['refunded_at', 'Refunded At', 'datetime'],
  ['subtotal_formatted', 'Subtotal (Formatted)'],
  ['discount_total_formatted', 'Discount Total (Formatted)'],
  ['tax_formatted', 'Tax (Formatted)'],
  ['total_formatted', 'Total (Formatted)'],
  ['refunded_amount_formatted', 'Refunded Amount (Formatted)'],
  ...timestamps,
  testMode,
];
const orderNested: OutputSchemaField[] = [
  {
    key: 'first_order_item',
    label: 'First Order Item',
    children: fields([['id', 'ID', 'number'], ...orderItemSpecs]),
  },
  { key: 'urls', label: 'URLs', children: fields([['receipt', 'Receipt', 'url']]) },
];

const productSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['name', 'Name'],
  ['slug', 'Slug'],
  ['description', 'Description', 'html'],
  ['status', 'Status', undefined, 'draft or published.'],
  ['status_formatted', 'Status (Formatted)'],
  ['thumb_url', 'Thumbnail URL', 'image'],
  ['large_thumb_url', 'Large Thumbnail URL', 'image'],
  ['price', 'Price', 'number', CENTS],
  ['price_formatted', 'Price (Formatted)'],
  ['from_price', 'From Price', 'number', CENTS],
  ['to_price', 'To Price', 'number', CENTS],
  ['pay_what_you_want', 'Pay What You Want', 'boolean'],
  ['buy_now_url', 'Buy Now URL', 'url'],
  ...timestamps,
  testMode,
];

const variantSpecs: Spec[] = [
  ['product_id', 'Product ID', 'number'],
  ['name', 'Name'],
  ['slug', 'Slug'],
  ['description', 'Description', 'html'],
  ['price', 'Price', 'number', CENTS],
  ['is_subscription', 'Is Subscription', 'boolean'],
  ['interval', 'Interval', undefined, 'day, week, month or year.'],
  ['interval_count', 'Interval Count', 'number'],
  ['has_free_trial', 'Has Free Trial', 'boolean'],
  ['trial_interval', 'Trial Interval'],
  ['trial_interval_count', 'Trial Interval Count', 'number'],
  ['pay_what_you_want', 'Pay What You Want', 'boolean'],
  ['min_price', 'Minimum Price', 'number', CENTS],
  ['suggested_price', 'Suggested Price', 'number', CENTS],
  ['has_license_keys', 'Has License Keys', 'boolean'],
  ['license_activation_limit', 'License Activation Limit', 'number'],
  ['is_license_limit_unlimited', 'License Limit Unlimited', 'boolean'],
  ['license_length_value', 'License Length', 'number'],
  ['license_length_unit', 'License Length Unit'],
  ['is_license_length_unlimited', 'License Length Unlimited', 'boolean'],
  ['sort', 'Sort', 'number'],
  ['status', 'Status', undefined, 'pending, draft or published.'],
  ['status_formatted', 'Status (Formatted)'],
  ...timestamps,
  testMode,
];

const subscriptionSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['customer_id', 'Customer ID', 'number'],
  ['order_id', 'Order ID', 'number'],
  ['order_item_id', 'Order Item ID', 'number'],
  ['product_id', 'Product ID', 'number'],
  ['variant_id', 'Variant ID', 'number'],
  ['product_name', 'Product Name'],
  ['variant_name', 'Variant Name'],
  ['user_name', 'Customer Name'],
  ['user_email', 'Customer Email', 'email'],
  ['status', 'Status', undefined, 'on_trial, active, paused, past_due, unpaid, cancelled or expired.'],
  ['status_formatted', 'Status (Formatted)'],
  ['card_brand', 'Card Brand'],
  ['card_last_four', 'Card Last Four'],
  ['payment_processor', 'Payment Processor', undefined, 'stripe or paypal.'],
  ['cancelled', 'Cancelled', 'boolean'],
  ['trial_ends_at', 'Trial Ends At', 'datetime'],
  ['billing_anchor', 'Billing Anchor (day of month)', 'number'],
  ['renews_at', 'Renews At', 'datetime'],
  ['ends_at', 'Ends At', 'datetime'],
  ...timestamps,
  testMode,
];
const subscriptionNested: OutputSchemaField[] = [
  {
    key: 'pause',
    label: 'Pause',
    description: 'Null when the subscription is not paused.',
    children: fields([
      ['mode', 'Mode', undefined, 'void or free.'],
      ['resumes_at', 'Resumes At', 'datetime'],
    ]),
  },
  {
    key: 'first_subscription_item',
    label: 'First Subscription Item',
    children: fields([
      ['id', 'ID', 'number'],
      ['subscription_id', 'Subscription ID', 'number'],
      ['price_id', 'Price ID', 'number'],
      ['quantity', 'Quantity', 'number'],
      ['is_usage_based', 'Is Usage Based', 'boolean'],
      ['created_at', 'Created At', 'datetime'],
      ['updated_at', 'Updated At', 'datetime'],
    ]),
  },
  {
    key: 'urls',
    label: 'URLs',
    children: fields([
      ['update_payment_method', 'Update Payment Method', 'url'],
      ['customer_portal', 'Customer Portal', 'url'],
      ['customer_portal_update_subscription', 'Customer Portal (Update Subscription)', 'url'],
    ]),
  },
];

const subscriptionInvoiceSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['subscription_id', 'Subscription ID', 'number'],
  ['customer_id', 'Customer ID', 'number'],
  ['user_name', 'Customer Name'],
  ['user_email', 'Customer Email', 'email'],
  ['billing_reason', 'Billing Reason', undefined, 'initial, renewal or updated.'],
  ['card_brand', 'Card Brand'],
  ['card_last_four', 'Card Last Four'],
  ['currency', 'Currency'],
  ['currency_rate', 'Currency Rate'],
  ['status', 'Status', undefined, 'pending, paid, void, refunded or partial_refund.'],
  ['status_formatted', 'Status (Formatted)'],
  ['refunded', 'Refunded', 'boolean'],
  ['refunded_at', 'Refunded At', 'datetime'],
  ['subtotal', 'Subtotal', 'number', CENTS],
  ['discount_total', 'Discount Total', 'number', CENTS],
  ['tax', 'Tax', 'number', CENTS],
  ['tax_inclusive', 'Tax Inclusive', 'boolean'],
  ['total', 'Total', 'number', CENTS],
  ['refunded_amount', 'Refunded Amount', 'number', CENTS],
  ['subtotal_usd', 'Subtotal (USD cents)', 'number'],
  ['discount_total_usd', 'Discount Total (USD cents)', 'number'],
  ['tax_usd', 'Tax (USD cents)', 'number'],
  ['total_usd', 'Total (USD cents)', 'number'],
  ['refunded_amount_usd', 'Refunded Amount (USD cents)', 'number'],
  ['affiliate_id', 'Affiliate ID', 'number'],
  ['referral_amount', 'Referral Amount', 'number', CENTS],
  ['subtotal_formatted', 'Subtotal (Formatted)'],
  ['discount_total_formatted', 'Discount Total (Formatted)'],
  ['tax_formatted', 'Tax (Formatted)'],
  ['total_formatted', 'Total (Formatted)'],
  ['refunded_amount_formatted', 'Refunded Amount (Formatted)'],
  ...timestamps,
  testMode,
];
const invoiceUrls: OutputSchemaField = { key: 'urls', label: 'URLs', children: fields([['invoice_url', 'Invoice URL', 'url']]) };

const discountSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['name', 'Name'],
  ['code', 'Code'],
  ['amount', 'Amount', 'number', 'Percent (0–100) when amount_type is percent, cents when fixed.'],
  ['amount_type', 'Amount Type', undefined, 'percent or fixed.'],
  ['is_limited_to_products', 'Limited to Products', 'boolean'],
  ['is_limited_redemptions', 'Limited Redemptions', 'boolean'],
  ['max_redemptions', 'Max Redemptions', 'number'],
  ['starts_at', 'Starts At', 'datetime'],
  ['expires_at', 'Expires At', 'datetime'],
  ['duration', 'Duration', undefined, 'once, repeating or forever.'],
  ['duration_in_months', 'Duration in Months', 'number'],
  ['status', 'Status', undefined, 'draft or published.'],
  ['status_formatted', 'Status (Formatted)'],
  ...timestamps,
  testMode,
];

const licenseKeySpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['customer_id', 'Customer ID', 'number'],
  ['order_id', 'Order ID', 'number'],
  ['order_item_id', 'Order Item ID', 'number'],
  ['product_id', 'Product ID', 'number'],
  ['user_name', 'Customer Name'],
  ['user_email', 'Customer Email', 'email'],
  ['key', 'License Key', undefined, 'The full license key.'],
  ['key_short', 'License Key (Short)', undefined, 'Last 4 characters prefixed with XXXX.'],
  ['activation_limit', 'Activation Limit', 'number', 'Null when unlimited.'],
  ['instances_count', 'Activations', 'number'],
  ['disabled', 'Disabled', 'boolean'],
  ['status', 'Status', undefined, 'inactive, active, expired or disabled.'],
  ['status_formatted', 'Status (Formatted)'],
  ['expires_at', 'Expires At', 'datetime'],
  ...timestamps,
  testMode,
];

const licenseKeyInstanceSpecs: Spec[] = [
  ['license_key_id', 'License Key ID', 'number'],
  ['identifier', 'Instance Identifier'],
  ['name', 'Instance Name'],
  ...timestamps,
];

const discountRedemptionSpecs: Spec[] = [
  ['discount_id', 'Discount ID', 'number'],
  ['order_id', 'Order ID', 'number'],
  ['discount_name', 'Discount Name'],
  ['discount_code', 'Discount Code'],
  ['discount_amount', 'Discount Amount', 'number', 'Percent or cents, depending on the amount type.'],
  ['discount_amount_type', 'Discount Amount Type', undefined, 'percent or fixed.'],
  ['amount', 'Amount Saved', 'number', CENTS],
  ...timestamps,
];

const subscriptionItemSpecs: Spec[] = [
  ['subscription_id', 'Subscription ID', 'number'],
  ['price_id', 'Price ID', 'number'],
  ['quantity', 'Quantity', 'number'],
  ['is_usage_based', 'Is Usage Based', 'boolean'],
  ...timestamps,
];

const affiliateSpecs: Spec[] = [
  ['store_id', 'Store ID', 'number'],
  ['user_id', 'User ID', 'number'],
  ['user_name', 'Name'],
  ['user_email', 'Email', 'email'],
  ['share_domain', 'Share Domain'],
  ['status', 'Status'],
  ['application_note', 'Application Note'],
  ['total_earnings', 'Total Earnings', 'number', CENTS],
  ['unpaid_earnings', 'Unpaid Earnings', 'number', CENTS],
  ...timestamps,
];

const flat = ({ specs, nested = [] }: { specs: Spec[]; nested?: OutputSchemaField[] }): OutputSchemaField[] => [
  { key: 'id', label: 'ID' },
  ...fields(specs),
  ...nested,
];

export const flatFields = {
  store: flat({ specs: storeSpecs }),
  customer: flat({ specs: customerSpecs, nested: [customerUrls] }),
  order: flat({ specs: orderSpecs, nested: orderNested }),
  orderItem: flat({ specs: orderItemSpecs }),
  product: flat({ specs: productSpecs }),
  variant: flat({ specs: variantSpecs }),
  subscription: flat({ specs: subscriptionSpecs, nested: subscriptionNested }),
  subscriptionInvoice: flat({ specs: subscriptionInvoiceSpecs, nested: [invoiceUrls] }),
  discount: flat({ specs: discountSpecs }),
  licenseKey: flat({ specs: licenseKeySpecs }),
  licenseKeyInstance: flat({ specs: licenseKeyInstanceSpecs }),
  discountRedemption: flat({ specs: discountRedemptionSpecs }),
  subscriptionItem: flat({ specs: subscriptionItemSpecs }),
  affiliate: flat({ specs: affiliateSpecs }),
};

export const recordSchema = (f: OutputSchemaField[]): OutputSchema => ({ fields: f });

export const listSchema = ({ fields: f, itemLabel }: { fields: OutputSchemaField[]; itemLabel: string }): OutputSchema => ({
  fields: [
    { key: 'items', label: 'Items', listItems: f, labelKey: itemLabel },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'last_page', label: 'Last Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    { key: 'total', label: 'Total Matches', format: 'number' },
    { key: 'has_more', label: 'Has More Pages', format: 'boolean' },
  ],
});

const rawResource = ({ specs, nested = [] }: { specs: Spec[]; nested?: OutputSchemaField[] }): OutputSchemaField[] => [
  { key: 'type', label: 'Type' },
  { key: 'id', label: 'ID' },
  { key: 'attributes', label: 'Attributes', children: [...fields(specs), ...nested] },
];

const rawPageMeta: OutputSchemaField = {
  key: 'meta',
  label: 'Meta',
  children: [
    {
      key: 'page',
      label: 'Page',
      children: fields([
        ['currentPage', 'Current Page', 'number'],
        ['from', 'From', 'number'],
        ['lastPage', 'Last Page', 'number'],
        ['perPage', 'Per Page', 'number'],
        ['to', 'To', 'number'],
        ['total', 'Total', 'number'],
      ]),
    },
  ],
};

const rawListSchema = ({ specs, nested = [] }: { specs: Spec[]; nested?: OutputSchemaField[] }): OutputSchema => ({
  fields: [rawPageMeta, { key: 'data', label: 'Data', listItems: rawResource({ specs, nested }) }],
});

export const rawSchemas = {
  products: rawListSchema({ specs: productSpecs }),
  orders: rawListSchema({ specs: orderSpecs, nested: orderNested }),
  subscriptions: rawListSchema({ specs: subscriptionSpecs, nested: subscriptionNested }),
  customers: rawListSchema({ specs: customerSpecs, nested: [customerUrls] }),
  order: { fields: [{ key: 'data', label: 'Data', children: rawResource({ specs: orderSpecs, nested: orderNested }) }] },
  checkout: {
    fields: [
      {
        key: 'data',
        label: 'Data',
        children: rawResource({
          specs: [
            ['store_id', 'Store ID', 'number'],
            ['variant_id', 'Variant ID', 'number'],
            ['custom_price', 'Custom Price', 'number', CENTS],
            ['expires_at', 'Expires At', 'datetime'],
            ['url', 'Checkout URL', 'url'],
            ...timestamps,
            testMode,
          ],
        }),
      },
    ],
  },
} satisfies Record<string, OutputSchema>;

const webhookSchema = ({ specs, nested = [] }: { specs: Spec[]; nested?: OutputSchemaField[] }): OutputSchema => ({
  fields: [
    {
      key: 'meta',
      label: 'Meta',
      children: [
        ...fields([
          ['event_name', 'Event Name'],
          ['test_mode', 'Test Mode', 'boolean'],
          ['webhook_id', 'Webhook ID'],
        ]),
        { key: 'custom_data', label: 'Custom Data', description: 'Custom data passed at checkout, if any.' },
      ],
    },
    { key: 'data', label: 'Data', children: rawResource({ specs, nested }) },
  ],
});

export const validateLicenseSchema: OutputSchema = {
  fields: [
    { key: 'valid', label: 'Valid', format: 'boolean' },
    { key: 'error', label: 'Error', description: 'Why the key is not valid. Null when valid.' },
    {
      key: 'license_key',
      label: 'License Key',
      description: 'Null when the key does not exist. The key itself is not returned.',
      children: fields([
        ['id', 'License Key ID', 'number'],
        ['status', 'Status', undefined, 'inactive, active, expired or disabled.'],
        ['activation_limit', 'Activation Limit', 'number'],
        ['activation_usage', 'Activations Used', 'number'],
        ['expires_at', 'Expires At', 'datetime'],
        ['created_at', 'Created At', 'datetime'],
        ['test_mode', 'Test Mode', 'boolean'],
      ]),
    },
    {
      key: 'instance',
      label: 'Instance',
      description: 'Null unless an instance ID was given and matched.',
      children: fields([
        ['id', 'Instance ID'],
        ['name', 'Name'],
        ['created_at', 'Created At', 'datetime'],
      ]),
    },
    {
      key: 'meta',
      label: 'Purchase',
      children: fields([
        ['store_id', 'Store ID', 'number'],
        ['order_id', 'Order ID', 'number'],
        ['order_item_id', 'Order Item ID', 'number'],
        ['product_id', 'Product ID', 'number'],
        ['product_name', 'Product Name'],
        ['variant_id', 'Variant ID', 'number'],
        ['variant_name', 'Variant Name'],
        ['customer_id', 'Customer ID', 'number'],
        ['customer_name', 'Customer Name'],
        ['customer_email', 'Customer Email', 'email'],
      ]),
    },
  ],
};

export const webhookSchemas = {
  order: webhookSchema({ specs: orderSpecs, nested: orderNested }),
  subscription: webhookSchema({ specs: subscriptionSpecs, nested: subscriptionNested }),
  subscriptionInvoice: webhookSchema({ specs: subscriptionInvoiceSpecs, nested: [invoiceUrls] }),
  licenseKey: webhookSchema({ specs: licenseKeySpecs }),
  affiliate: webhookSchema({ specs: affiliateSpecs }),
};
