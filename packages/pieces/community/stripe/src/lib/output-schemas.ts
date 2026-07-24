import { OutputSchema } from '@activepieces/pieces-framework';

function listSchema(
  itemFields: OutputSchema['fields'],
  labelKey: string
): OutputSchema {
  return {
    fields: [
      { key: 'data', label: 'Data', labelKey, listItems: itemFields },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'url', label: 'URL' },
    ],
  };
}

function searchSchema(
  itemFields: OutputSchema['fields'],
  labelKey: string
): OutputSchema {
  return {
    fields: [
      { key: 'data', label: 'Results', labelKey, listItems: itemFields },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'next_page', label: 'Next Page' },
      { key: 'url', label: 'URL' },
    ],
  };
}

const addressFields: OutputSchema['fields'] = [
  { key: 'line1', label: 'Line 1' },
  { key: 'line2', label: 'Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
];

const cardFields: OutputSchema['fields'] = [
  { key: 'brand', label: 'Brand' },
  { key: 'last4', label: 'Last 4' },
  { key: 'exp_month', label: 'Expiry Month', format: 'number' },
  { key: 'exp_year', label: 'Expiry Year', format: 'number' },
  { key: 'funding', label: 'Funding' },
  { key: 'country', label: 'Country' },
  { key: 'display_brand', label: 'Display Brand' },
];

const billingDetailsFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address', children: addressFields },
];

const customerFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Customer ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address', children: addressFields },
  { key: 'balance', label: 'Balance', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'delinquent', label: 'Delinquent', format: 'boolean' },
  { key: 'invoice_prefix', label: 'Invoice Prefix' },
  { key: 'tax_exempt', label: 'Tax Exempt' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const productFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Product ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'default_price', label: 'Default Price' },
  { key: 'images', label: 'Images' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'unit_label', label: 'Unit Label' },
  { key: 'type', label: 'Type' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const priceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Price ID' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'currency', label: 'Currency' },
  { key: 'product', label: 'Product' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'unit_amount', label: 'Unit Amount', format: 'number' },
  { key: 'unit_amount_decimal', label: 'Unit Amount Decimal' },
  { key: 'type', label: 'Type' },
  { key: 'billing_scheme', label: 'Billing Scheme' },
  { key: 'tax_behavior', label: 'Tax Behavior' },
  { key: 'lookup_key', label: 'Lookup Key' },
  {
    key: 'recurring',
    label: 'Recurring',
    children: [
      { key: 'interval', label: 'Interval' },
      { key: 'interval_count', label: 'Interval Count', format: 'number' },
      { key: 'trial_period_days', label: 'Trial Period Days', format: 'number' },
      { key: 'usage_type', label: 'Usage Type' },
    ],
  },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const couponFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Coupon ID' },
  { key: 'name', label: 'Name' },
  { key: 'amount_off', label: 'Amount Off', format: 'number' },
  { key: 'percent_off', label: 'Percent Off', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'duration', label: 'Duration' },
  { key: 'duration_in_months', label: 'Duration In Months', format: 'number' },
  { key: 'max_redemptions', label: 'Max Redemptions', format: 'number' },
  { key: 'times_redeemed', label: 'Times Redeemed', format: 'number' },
  { key: 'redeem_by', label: 'Redeem By', format: 'datetime' },
  { key: 'valid', label: 'Valid', format: 'boolean' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const promotionCodeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Promotion Code ID' },
  { key: 'code', label: 'Code' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'customer', label: 'Customer' },
  { key: 'coupon', label: 'Coupon', children: couponFields },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  { key: 'max_redemptions', label: 'Max Redemptions', format: 'number' },
  { key: 'times_redeemed', label: 'Times Redeemed', format: 'number' },
  {
    key: 'restrictions',
    label: 'Restrictions',
    children: [
      {
        key: 'first_time_transaction',
        label: 'First Time Transaction',
        format: 'boolean',
      },
      { key: 'minimum_amount', label: 'Minimum Amount', format: 'number' },
      { key: 'minimum_amount_currency', label: 'Minimum Amount Currency' },
    ],
  },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const taxRateFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tax Rate ID' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'percentage', label: 'Percentage', format: 'number' },
  { key: 'effective_percentage', label: 'Effective Percentage', format: 'number' },
  { key: 'inclusive', label: 'Inclusive', format: 'boolean' },
  { key: 'country', label: 'Country' },
  { key: 'state', label: 'State' },
  { key: 'jurisdiction', label: 'Jurisdiction' },
  { key: 'tax_type', label: 'Tax Type' },
  { key: 'rate_type', label: 'Rate Type' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const paymentMethodFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment Method ID' },
  { key: 'type', label: 'Type' },
  { key: 'customer', label: 'Customer' },
  { key: 'billing_details', label: 'Billing Details', children: billingDetailsFields },
  { key: 'card', label: 'Card', children: cardFields },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const paymentIntentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment Intent ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'amount_received', label: 'Amount Received', format: 'number' },
  { key: 'amount_capturable', label: 'Amount Capturable', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'customer', label: 'Customer' },
  { key: 'description', label: 'Description' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'latest_charge', label: 'Latest Charge' },
  { key: 'capture_method', label: 'Capture Method' },
  { key: 'confirmation_method', label: 'Confirmation Method' },
  { key: 'client_secret', label: 'Client Secret' },
  { key: 'receipt_email', label: 'Receipt Email', format: 'email' },
  { key: 'setup_future_usage', label: 'Setup Future Usage' },
  { key: 'cancellation_reason', label: 'Cancellation Reason' },
  { key: 'canceled_at', label: 'Canceled At', format: 'datetime' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const chargeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Charge ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'amount_captured', label: 'Amount Captured', format: 'number' },
  { key: 'amount_refunded', label: 'Amount Refunded', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'paid', label: 'Paid', format: 'boolean' },
  { key: 'captured', label: 'Captured', format: 'boolean' },
  { key: 'refunded', label: 'Refunded', format: 'boolean' },
  { key: 'disputed', label: 'Disputed', format: 'boolean' },
  { key: 'customer', label: 'Customer' },
  { key: 'description', label: 'Description' },
  { key: 'payment_intent', label: 'Payment Intent' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'balance_transaction', label: 'Balance Transaction' },
  { key: 'receipt_url', label: 'Receipt URL', format: 'url' },
  { key: 'receipt_email', label: 'Receipt Email', format: 'email' },
  { key: 'receipt_number', label: 'Receipt Number' },
  { key: 'calculated_statement_descriptor', label: 'Statement Descriptor' },
  { key: 'billing_details', label: 'Billing Details', children: billingDetailsFields },
  { key: 'failure_code', label: 'Failure Code' },
  { key: 'failure_message', label: 'Failure Message' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const balanceTransactionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Balance Transaction ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'net', label: 'Net', format: 'number' },
  { key: 'fee', label: 'Fee', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'reporting_category', label: 'Reporting Category' },
  { key: 'source', label: 'Source' },
  { key: 'available_on', label: 'Available On', format: 'datetime' },
  { key: 'created', label: 'Created', format: 'datetime' },
  {
    key: 'fee_details',
    label: 'Fee Details',
    labelKey: 'description',
    listItems: [
      { key: 'amount', label: 'Amount', format: 'number' },
      { key: 'currency', label: 'Currency' },
      { key: 'type', label: 'Type' },
      { key: 'description', label: 'Description' },
    ],
  },
];

const refundFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Refund ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'charge', label: 'Charge' },
  { key: 'payment_intent', label: 'Payment Intent' },
  { key: 'payment_method', label: 'Payment Method' },
  { key: 'balance_transaction', label: 'Balance Transaction' },
  { key: 'reason', label: 'Reason' },
  { key: 'receipt_number', label: 'Receipt Number' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const invoiceItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Invoice Item ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'customer', label: 'Customer' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'description', label: 'Description' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'discountable', label: 'Discountable', format: 'boolean' },
  { key: 'proration', label: 'Proration', format: 'boolean' },
  {
    key: 'period',
    label: 'Period',
    children: [
      { key: 'start', label: 'Start', format: 'datetime' },
      { key: 'end', label: 'End', format: 'datetime' },
    ],
  },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const creditNoteFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Credit Note ID' },
  { key: 'number', label: 'Number' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'reason', label: 'Reason' },
  { key: 'customer', label: 'Customer' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'memo', label: 'Memo' },
  { key: 'subtotal', label: 'Subtotal', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'discount_amount', label: 'Discount Amount', format: 'number' },
  { key: 'pre_payment_amount', label: 'Pre-Payment Amount', format: 'number' },
  { key: 'post_payment_amount', label: 'Post-Payment Amount', format: 'number' },
  { key: 'pdf', label: 'PDF', format: 'url' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'effective_at', label: 'Effective At', format: 'datetime' },
  { key: 'voided_at', label: 'Voided At', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const checkoutSessionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Checkout Session ID' },
  { key: 'status', label: 'Status' },
  { key: 'payment_status', label: 'Payment Status' },
  { key: 'mode', label: 'Mode' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'success_url', label: 'Success URL', format: 'url' },
  { key: 'cancel_url', label: 'Cancel URL', format: 'url' },
  { key: 'amount_subtotal', label: 'Amount Subtotal', format: 'number' },
  { key: 'amount_total', label: 'Amount Total', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'customer', label: 'Customer' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'payment_intent', label: 'Payment Intent' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'invoice', label: 'Invoice' },
  { key: 'payment_link', label: 'Payment Link' },
  { key: 'client_reference_id', label: 'Client Reference ID' },
  {
    key: 'total_details',
    label: 'Total Details',
    children: [
      { key: 'amount_discount', label: 'Amount Discount', format: 'number' },
      { key: 'amount_shipping', label: 'Amount Shipping', format: 'number' },
      { key: 'amount_tax', label: 'Amount Tax', format: 'number' },
    ],
  },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const paymentLinkFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payment Link ID' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'currency', label: 'Currency' },
  { key: 'allow_promotion_codes', label: 'Allow Promotion Codes', format: 'boolean' },
  { key: 'billing_address_collection', label: 'Billing Address Collection' },
  { key: 'customer_creation', label: 'Customer Creation' },
  { key: 'payment_method_collection', label: 'Payment Method Collection' },
  { key: 'submit_type', label: 'Submit Type' },
  { key: 'application_fee_amount', label: 'Application Fee Amount', format: 'number' },
  { key: 'application_fee_percent', label: 'Application Fee Percent', format: 'number' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const disputeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Dispute ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'reason', label: 'Reason' },
  { key: 'charge', label: 'Charge' },
  { key: 'payment_intent', label: 'Payment Intent' },
  { key: 'balance_transaction', label: 'Balance Transaction' },
  { key: 'is_charge_refundable', label: 'Is Charge Refundable', format: 'boolean' },
  {
    key: 'evidence_details',
    label: 'Evidence Details',
    children: [
      { key: 'due_by', label: 'Due By', format: 'datetime' },
      { key: 'has_evidence', label: 'Has Evidence', format: 'boolean' },
      { key: 'past_due', label: 'Past Due', format: 'boolean' },
      { key: 'submission_count', label: 'Submission Count', format: 'number' },
    ],
  },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const payoutFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Payout ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'method', label: 'Method' },
  { key: 'automatic', label: 'Automatic', format: 'boolean' },
  { key: 'arrival_date', label: 'Arrival Date', format: 'datetime' },
  { key: 'balance_transaction', label: 'Balance Transaction' },
  { key: 'destination', label: 'Destination' },
  { key: 'description', label: 'Description' },
  { key: 'statement_descriptor', label: 'Statement Descriptor' },
  { key: 'source_type', label: 'Source Type' },
  { key: 'failure_code', label: 'Failure Code' },
  { key: 'failure_message', label: 'Failure Message' },
  { key: 'reconciliation_status', label: 'Reconciliation Status' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const transferFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Transfer ID' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'amount_reversed', label: 'Amount Reversed', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'description', label: 'Description' },
  { key: 'destination', label: 'Destination' },
  { key: 'source_transaction', label: 'Source Transaction' },
  { key: 'transfer_group', label: 'Transfer Group' },
  { key: 'reversed', label: 'Reversed', format: 'boolean' },
  { key: 'balance_transaction', label: 'Balance Transaction' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const eventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Event ID' },
  { key: 'type', label: 'Type' },
  { key: 'api_version', label: 'API Version' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'pending_webhooks', label: 'Pending Webhooks', format: 'number' },
  {
    key: 'request',
    label: 'Request',
    children: [
      { key: 'id', label: 'Request ID' },
      { key: 'idempotency_key', label: 'Idempotency Key' },
    ],
  },
  {
    key: 'data',
    label: 'Data',
    children: [{ key: 'object', label: 'Object' }],
  },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
];

const subscriptionItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Subscription Item ID' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'subscription', label: 'Subscription' },
  { key: 'current_period_start', label: 'Current Period Start', format: 'datetime' },
  { key: 'current_period_end', label: 'Current Period End', format: 'datetime' },
  { key: 'price', label: 'Price', children: priceFields },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const subscriptionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Subscription ID' },
  { key: 'status', label: 'Status' },
  { key: 'customer', label: 'Customer' },
  { key: 'currency', label: 'Currency' },
  { key: 'description', label: 'Description' },
  { key: 'collection_method', label: 'Collection Method' },
  { key: 'latest_invoice', label: 'Latest Invoice' },
  { key: 'default_payment_method', label: 'Default Payment Method' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'start_date', label: 'Start Date', format: 'datetime' },
  { key: 'billing_cycle_anchor', label: 'Billing Cycle Anchor', format: 'datetime' },
  { key: 'cancel_at', label: 'Cancel At', format: 'datetime' },
  { key: 'canceled_at', label: 'Canceled At', format: 'datetime' },
  { key: 'cancel_at_period_end', label: 'Cancel At Period End', format: 'boolean' },
  { key: 'ended_at', label: 'Ended At', format: 'datetime' },
  { key: 'trial_start', label: 'Trial Start', format: 'datetime' },
  { key: 'trial_end', label: 'Trial End', format: 'datetime' },
  {
    key: 'items',
    label: 'Items',
    children: [
      {
        key: 'data',
        label: 'Data',
        labelKey: 'id',
        listItems: subscriptionItemFields,
      },
    ],
  },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const invoiceLineFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Line ID' },
  { key: 'description', label: 'Description' },
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
  { key: 'subtotal', label: 'Subtotal', format: 'number' },
  { key: 'invoice', label: 'Invoice' },
  {
    key: 'period',
    label: 'Period',
    children: [
      { key: 'start', label: 'Start', format: 'datetime' },
      { key: 'end', label: 'End', format: 'datetime' },
    ],
  },
  { key: 'discountable', label: 'Discountable', format: 'boolean' },
];

const invoiceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Invoice ID' },
  { key: 'number', label: 'Number' },
  { key: 'status', label: 'Status' },
  { key: 'currency', label: 'Currency' },
  { key: 'customer', label: 'Customer' },
  { key: 'customer_email', label: 'Customer Email', format: 'email' },
  { key: 'customer_name', label: 'Customer Name' },
  { key: 'customer_phone', label: 'Customer Phone' },
  { key: 'description', label: 'Description' },
  { key: 'collection_method', label: 'Collection Method' },
  { key: 'billing_reason', label: 'Billing Reason' },
  { key: 'amount_due', label: 'Amount Due', format: 'number' },
  { key: 'amount_paid', label: 'Amount Paid', format: 'number' },
  { key: 'amount_remaining', label: 'Amount Remaining', format: 'number' },
  { key: 'subtotal', label: 'Subtotal', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'attempt_count', label: 'Attempt Count', format: 'number' },
  { key: 'attempted', label: 'Attempted', format: 'boolean' },
  { key: 'auto_advance', label: 'Auto Advance', format: 'boolean' },
  { key: 'due_date', label: 'Due Date', format: 'datetime' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'period_start', label: 'Period Start', format: 'datetime' },
  { key: 'period_end', label: 'Period End', format: 'datetime' },
  { key: 'effective_at', label: 'Effective At', format: 'datetime' },
  { key: 'hosted_invoice_url', label: 'Hosted Invoice URL', format: 'url' },
  { key: 'invoice_pdf', label: 'Invoice PDF', format: 'url' },
  { key: 'receipt_number', label: 'Receipt Number' },
  { key: 'starting_balance', label: 'Starting Balance', format: 'number' },
  { key: 'ending_balance', label: 'Ending Balance', format: 'number' },
  {
    key: 'status_transitions',
    label: 'Status Transitions',
    children: [
      { key: 'finalized_at', label: 'Finalized At', format: 'datetime' },
      { key: 'paid_at', label: 'Paid At', format: 'datetime' },
      {
        key: 'marked_uncollectible_at',
        label: 'Marked Uncollectible At',
        format: 'datetime',
      },
      { key: 'voided_at', label: 'Voided At', format: 'datetime' },
    ],
  },
  {
    key: 'lines',
    label: 'Lines',
    children: [
      {
        key: 'data',
        label: 'Data',
        labelKey: 'description',
        listItems: invoiceLineFields,
      },
    ],
  },
  { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
];

const balanceAmountFields: OutputSchema['fields'] = [
  { key: 'amount', label: 'Amount', format: 'number' },
  { key: 'currency', label: 'Currency' },
];

export const customerOutputSchema: OutputSchema = { fields: customerFields };
export const productOutputSchema: OutputSchema = { fields: productFields };
export const priceOutputSchema: OutputSchema = { fields: priceFields };
export const couponOutputSchema: OutputSchema = { fields: couponFields };
export const promotionCodeOutputSchema: OutputSchema = { fields: promotionCodeFields };
export const taxRateOutputSchema: OutputSchema = { fields: taxRateFields };
export const paymentMethodOutputSchema: OutputSchema = { fields: paymentMethodFields };
export const paymentIntentOutputSchema: OutputSchema = { fields: paymentIntentFields };
export const chargeOutputSchema: OutputSchema = { fields: chargeFields };
export const refundOutputSchema: OutputSchema = { fields: refundFields };
export const invoiceItemOutputSchema: OutputSchema = { fields: invoiceItemFields };
export const invoiceOutputSchema: OutputSchema = { fields: invoiceFields };
export const subscriptionOutputSchema: OutputSchema = { fields: subscriptionFields };
export const creditNoteOutputSchema: OutputSchema = { fields: creditNoteFields };
export const paymentLinkOutputSchema: OutputSchema = { fields: paymentLinkFields };
export const checkoutSessionOutputSchema: OutputSchema = { fields: checkoutSessionFields };
export const disputeOutputSchema: OutputSchema = { fields: disputeFields };
export const payoutOutputSchema: OutputSchema = { fields: payoutFields };
export const eventOutputSchema: OutputSchema = { fields: eventFields };

export const balanceOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'available',
      label: 'Available',
      labelKey: 'currency',
      listItems: balanceAmountFields,
    },
    {
      key: 'pending',
      label: 'Pending',
      labelKey: 'currency',
      listItems: balanceAmountFields,
    },
    { key: 'livemode', label: 'Live Mode', format: 'boolean' },
  ],
};

export const customerListOutputSchema = listSchema(customerFields, 'email');
export const productListOutputSchema = listSchema(productFields, 'name');
export const priceListOutputSchema = listSchema(priceFields, 'id');
export const couponListOutputSchema = listSchema(couponFields, 'name');
export const promotionCodeListOutputSchema = listSchema(promotionCodeFields, 'code');
export const taxRateListOutputSchema = listSchema(taxRateFields, 'display_name');
export const paymentMethodListOutputSchema = listSchema(paymentMethodFields, 'id');
export const paymentIntentListOutputSchema = listSchema(paymentIntentFields, 'id');
export const chargeListOutputSchema = listSchema(chargeFields, 'id');
export const refundListOutputSchema = listSchema(refundFields, 'id');
export const invoiceListOutputSchema = listSchema(invoiceFields, 'number');
export const invoiceLineListOutputSchema = listSchema(invoiceLineFields, 'description');
export const subscriptionListOutputSchema = listSchema(subscriptionFields, 'id');
export const subscriptionItemListOutputSchema = listSchema(subscriptionItemFields, 'id');
export const creditNoteListOutputSchema = listSchema(creditNoteFields, 'number');
export const paymentLinkListOutputSchema = listSchema(paymentLinkFields, 'id');
export const checkoutSessionListOutputSchema = listSchema(checkoutSessionFields, 'id');
export const disputeListOutputSchema = listSchema(disputeFields, 'id');
export const payoutListOutputSchema = listSchema(payoutFields, 'id');
export const transferListOutputSchema = listSchema(transferFields, 'id');
export const eventListOutputSchema = listSchema(eventFields, 'type');
export const balanceTransactionListOutputSchema = listSchema(balanceTransactionFields, 'id');

export const chargeSearchOutputSchema = searchSchema(chargeFields, 'id');
export const customerSearchOutputSchema = searchSchema(customerFields, 'email');
export const invoiceSearchOutputSchema = searchSchema(invoiceFields, 'number');
export const paymentIntentSearchOutputSchema = searchSchema(paymentIntentFields, 'id');
export const priceSearchOutputSchema = searchSchema(priceFields, 'id');
export const productSearchOutputSchema = searchSchema(productFields, 'name');

export const subscriptionSearchOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'total_fetched', label: 'Total Fetched', format: 'number' },
    { key: 'requests_made', label: 'Requests Made', format: 'number' },
    { key: 'has_more_available', label: 'Has More Available', format: 'boolean' },
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'id',
      listItems: subscriptionFields,
    },
  ],
};
