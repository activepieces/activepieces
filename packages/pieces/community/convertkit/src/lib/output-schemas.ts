import { OutputSchema } from '@activepieces/pieces-framework';

const subscriberFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Subscriber ID', format: 'number' },
  { key: 'first_name', label: 'First Name' },
  { key: 'email_address', label: 'Email Address', format: 'email' },
  { key: 'state', label: 'State' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'fields', label: 'Custom Fields', dynamicKey: true },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tag ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const customFieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Custom Field ID', format: 'number' },
  { key: 'key', label: 'Key' },
  { key: 'label', label: 'Label' },
  { key: 'name', label: 'Internal Name' },
];

const subscriptionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Subscription ID', format: 'number' },
  { key: 'state', label: 'State' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'source', label: 'Source' },
  { key: 'referrer', label: 'Referrer', format: 'url' },
  { key: 'subscribable_id', label: 'Subscribed To ID', format: 'number' },
  { key: 'subscribable_type', label: 'Subscribed To Type' },
  { key: 'subscriber', label: 'Subscriber', children: subscriberFields },
];

const broadcastSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Broadcast ID', format: 'number' },
  { key: 'subject', label: 'Subject' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const broadcastFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Broadcast ID', format: 'number' },
  { key: 'subject', label: 'Subject' },
  { key: 'description', label: 'Description' },
  { key: 'content', label: 'Content', format: 'html' },
  { key: 'public', label: 'Public', format: 'boolean' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'send_at', label: 'Send At', format: 'datetime' },
  { key: 'email_address', label: 'From Email', format: 'email' },
  { key: 'email_layout_template', label: 'Email Template' },
  { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
  { key: 'thumbnail_alt', label: 'Thumbnail Alt Text' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const broadcastStatsFields: OutputSchema['fields'] = [
  { key: 'status', label: 'Status' },
  { key: 'recipients', label: 'Recipients', format: 'number' },
  { key: 'emails_opened', label: 'Emails Opened', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', format: 'number' },
  { key: 'emails_clicked', label: 'Emails Clicked', format: 'number' },
  { key: 'total_clicks', label: 'Total Clicks', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', format: 'number' },
  { key: 'unsubscribes', label: 'Unsubscribes', format: 'number' },
  { key: 'unsubscribe_rate', label: 'Unsubscribe Rate', format: 'number' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'show_total_clicks', label: 'Show Total Clicks', format: 'boolean' },
  {
    key: 'open_tracking_disabled',
    label: 'Open Tracking Disabled',
    format: 'boolean',
  },
  {
    key: 'click_tracking_disabled',
    label: 'Click Tracking Disabled',
    format: 'boolean',
  },
];

const webhookRuleFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Webhook ID', format: 'number' },
  { key: 'target_url', label: 'Target URL', format: 'url' },
  {
    key: 'event',
    label: 'Event',
    children: [
      { key: 'name', label: 'Event Name' },
      { key: 'tag_id', label: 'Tag ID', format: 'number' },
      { key: 'initiator_value', label: 'Link URL', format: 'url' },
    ],
  },
  { key: 'account_id', label: 'Account ID', format: 'number' },
];

export const kitGetAccountOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Account Name' },
    { key: 'primary_email_address', label: 'Primary Email', format: 'email' },
    { key: 'plan_type', label: 'Plan Type' },
  ],
};

export const kitSubscriberOutputSchema: OutputSchema = {
  fields: subscriberFields,
};

export const kitListSubscribersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subscribers',
      label: 'Subscribers',
      labelKey: 'email_address',
      listItems: subscriberFields,
    },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'total_subscribers', label: 'Total Subscribers', format: 'number' },
  ],
};

export const kitSubscriberListOutputSchema: OutputSchema = {
  itemLabel: '{email_address}',
  fields: [
    {
      key: 'subscribers',
      label: 'Subscribers',
      value: '',
      listItems: subscriberFields,
    },
  ],
};

export const kitTagOutputSchema: OutputSchema = {
  fields: tagFields,
};

export const kitCreateTagOutputSchema: OutputSchema = {
  fields: [
    ...tagFields,
    { key: 'created', label: 'Newly Created', format: 'boolean' },
  ],
};

export const kitListTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const kitTagListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'tags', label: 'Tags', value: '', listItems: tagFields }],
};

export const kitSubscriptionOutputSchema: OutputSchema = {
  fields: subscriptionFields,
};

export const kitListTagSubscriptionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      labelKey: 'id',
      listItems: subscriptionFields,
    },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    {
      key: 'total_subscriptions',
      label: 'Total Subscriptions',
      format: 'number',
    },
  ],
};

export const kitSubscriptionListOutputSchema: OutputSchema = {
  itemLabel: 'Subscription {id}',
  fields: [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      value: '',
      listItems: subscriptionFields,
    },
  ],
};

export const kitRemoveTagByEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'tag_id', label: 'Tag ID', format: 'number' },
    { key: 'tag_name', label: 'Tag Name' },
  ],
};

export const kitRemoveTagFromSubscriberOutputSchema: OutputSchema = {
  fields: [
    { key: 'removed', label: 'Removed', format: 'boolean' },
    { key: 'subscriber_id', label: 'Subscriber ID' },
    { key: 'tag_id', label: 'Tag ID', format: 'number' },
    { key: 'tag_name', label: 'Tag Name' },
  ],
};

export const kitCustomFieldOutputSchema: OutputSchema = {
  fields: customFieldFields,
};

export const kitUpdateCustomFieldOutputSchema: OutputSchema = {
  fields: [
    ...customFieldFields,
    { key: 'refreshed', label: 'Read Back After Rename', format: 'boolean' },
    { key: 'refresh_error', label: 'Read Back Error' },
  ],
};

export const kitListCustomFieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'custom_fields',
      label: 'Custom Fields',
      labelKey: 'label',
      listItems: customFieldFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const kitCustomFieldListOutputSchema: OutputSchema = {
  itemLabel: '{label}',
  fields: [
    {
      key: 'custom_fields',
      label: 'Custom Fields',
      value: '',
      listItems: customFieldFields,
    },
  ],
};

export const kitDeleteCustomFieldOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'custom_field_id', label: 'Custom Field ID' },
  ],
};

export const kitRequestStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'status', label: 'Status Code', format: 'number' },
    { key: 'message', label: 'Message' },
  ],
};

export const kitListBroadcastsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'broadcasts',
      label: 'Broadcasts',
      labelKey: 'subject',
      listItems: broadcastSummaryFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
  ],
};

export const kitBroadcastListOutputSchema: OutputSchema = {
  itemLabel: '{subject}',
  fields: [
    {
      key: 'broadcasts',
      label: 'Broadcasts',
      value: '',
      listItems: broadcastSummaryFields,
    },
  ],
};

export const kitBroadcastOutputSchema: OutputSchema = {
  fields: broadcastFields,
};

export const kitGetBroadcastStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'broadcast_id', label: 'Broadcast ID', format: 'number' },
    ...broadcastStatsFields,
  ],
};

export const kitBroadcastStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Broadcast ID', format: 'number' },
    { key: 'stats', label: 'Stats', children: broadcastStatsFields },
  ],
};

export const kitDeleteBroadcastOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'broadcast_id', label: 'Broadcast ID' },
  ],
};

export const kitWebhookOutputSchema: OutputSchema = {
  fields: webhookRuleFields,
};

export const kitListWebhooksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rules',
      label: 'Webhooks',
      labelKey: 'target_url',
      listItems: [...webhookRuleFields, { key: 'status', label: 'Status' }],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const kitDeleteWebhookOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'rule_id', label: 'Webhook ID' },
  ],
};

const formFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Form ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'format', label: 'Format' },
  { key: 'embed_url', label: 'Embed URL', format: 'url' },
  { key: 'embed_js', label: 'Embed Script URL', format: 'url' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'uid', label: 'UID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const sequenceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sequence ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'active', label: 'Active', format: 'boolean' },
  { key: 'available', label: 'Available', format: 'boolean' },
  { key: 'hold', label: 'On Hold', format: 'boolean' },
  { key: 'repeat', label: 'Repeat', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const kitListFormsOutputSchema: OutputSchema = {
  fields: [
    { key: 'forms', label: 'Forms', labelKey: 'name', listItems: formFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const kitListSequencesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sequences',
      label: 'Sequences',
      labelKey: 'name',
      listItems: sequenceFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const kitFormListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [{ key: 'forms', label: 'Forms', value: '', listItems: formFields }],
};

export const kitSequenceListOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'sequences',
      label: 'Sequences',
      value: '',
      listItems: sequenceFields,
    },
  ],
};

const purchaseProductFields: OutputSchema['fields'] = [
  { key: 'pid', label: 'Product ID' },
  { key: 'lid', label: 'Line Item ID' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'unit_price', label: 'Unit Price', format: 'number' },
  { key: 'quantity', label: 'Quantity', format: 'number' },
];

const purchaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Purchase ID', format: 'number' },
  { key: 'transaction_id', label: 'Transaction ID' },
  { key: 'status', label: 'Status' },
  { key: 'email_address', label: 'Email Address', format: 'email' },
  { key: 'currency', label: 'Currency' },
  { key: 'transaction_time', label: 'Transaction Time', format: 'datetime' },
  { key: 'subtotal', label: 'Subtotal', format: 'number' },
  { key: 'discount', label: 'Discount', format: 'number' },
  { key: 'tax', label: 'Tax', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  {
    key: 'products',
    label: 'Products',
    labelKey: 'name',
    listItems: purchaseProductFields,
  },
];

export const kitPurchaseOutputSchema: OutputSchema = {
  fields: purchaseFields,
};

export const kitListPurchasesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'purchases',
      label: 'Purchases',
      labelKey: 'transaction_id',
      listItems: purchaseFields,
    },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'total_purchases', label: 'Total Purchases', format: 'number' },
  ],
};

export const kitPurchaseListOutputSchema: OutputSchema = {
  itemLabel: 'Purchase {transaction_id}',
  fields: [
    {
      key: 'purchases',
      label: 'Purchases',
      value: '',
      listItems: purchaseFields,
    },
  ],
};
