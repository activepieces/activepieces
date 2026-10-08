import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const pageFields: Fields = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'totalPages', label: 'Total Pages', format: 'number' },
  { key: 'totalCount', label: 'Total Count', format: 'number' },
  { key: 'hasMore', label: 'Has More', format: 'boolean', description: 'True when another page exists; pass Page + 1 to get it.' },
];

const subscriberFields: Fields = [
  { key: 'id', label: 'Subscriber ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'tags', label: 'Tags' },
  { key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
  { key: 'deliverable', label: 'Deliverable', format: 'boolean' },
  { key: 'address1', label: 'Address Line 1' },
  { key: 'address2', label: 'Address Line 2' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'zip', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
  { key: 'phone', label: 'Phone' },
  { key: 'sms_number', label: 'SMS Number' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'user_id', label: 'Your User ID' },
  { key: 'lifetime_value', label: 'Lifetime Value (cents)', format: 'number' },
  { key: 'lead_score', label: 'Lead Score', format: 'number' },
  { key: 'prospect', label: 'Prospect', format: 'boolean' },
  { key: 'eu_consent', label: 'EU Consent' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const webhookSubscriberFields: Fields = [
  { key: 'id', label: 'Subscriber ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'tags', label: 'Tags' },
  { key: 'custom_fields', label: 'Custom Fields', dynamicKey: true, description: 'Includes first_name and last_name when set.' },
  { key: 'deliverable', label: 'Deliverable', format: 'boolean' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'user_id', label: 'Your User ID' },
  { key: 'lifetime_value', label: 'Lifetime Value (cents)', format: 'number' },
  { key: 'lead_score', label: 'Lead Score', format: 'number' },
  { key: 'prospect', label: 'Prospect', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const webhookCauseFields: Fields = [
  { key: 'source', label: 'Source' },
];

const accountFields: Fields = [
  { key: 'id', label: 'Account ID', description: 'Pass this as Account ID in other Drip steps.' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'Website' },
  { key: 'primary_email', label: 'Primary Email', format: 'email' },
  { key: 'default_from_name', label: 'Default From Name' },
  { key: 'default_from_email', label: 'Default From Email', format: 'email' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const campaignFields: Fields = [
  { key: 'id', label: 'Campaign ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'from_name', label: 'From Name' },
  { key: 'from_email', label: 'From Email', format: 'email' },
  { key: 'email_count', label: 'Email Count', format: 'number' },
  { key: 'active_subscriber_count', label: 'Active Subscribers', format: 'number' },
  { key: 'unsubscribed_subscriber_count', label: 'Unsubscribed Subscribers', format: 'number' },
  { key: 'double_optin', label: 'Double Opt-In', format: 'boolean' },
  { key: 'start_immediately', label: 'Starts Immediately', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const workflowFields: Fields = [
  { key: 'id', label: 'Workflow ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const broadcastFields: Fields = [
  { key: 'id', label: 'Broadcast ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'subject', label: 'Subject' },
  { key: 'from_name', label: 'From Name' },
  { key: 'from_email', label: 'From Email', format: 'email' },
  { key: 'send_at', label: 'Send At', format: 'datetime' },
  { key: 'preview_url', label: 'Preview URL', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const conversionFields: Fields = [
  { key: 'id', label: 'Conversion ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'url', label: 'URL' },
  { key: 'default_value', label: 'Default Value (cents)', format: 'number' },
  { key: 'counting_method', label: 'Counting Method' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const formFields: Fields = [
  { key: 'id', label: 'Form ID' },
  { key: 'headline', label: 'Headline' },
  { key: 'description', label: 'Description' },
  { key: 'button_text', label: 'Button Text' },
  { key: 'is_widget_enabled', label: 'Widget Enabled', format: 'boolean' },
  { key: 'is_embeddable', label: 'Embeddable', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const campaignSubscriptionFields: Fields = [
  { key: 'id', label: 'Subscription ID' },
  { key: 'campaign_id', label: 'Campaign ID' },
  { key: 'status', label: 'Status' },
  { key: 'is_complete', label: 'Completed', format: 'boolean' },
  { key: 'lap', label: 'Lap', format: 'number' },
  { key: 'last_sent_email_index', label: 'Last Sent Email Index', format: 'number' },
  { key: 'last_sent_email_at', label: 'Last Sent Email At', format: 'datetime' },
];

export const dripOutputSchemas = {
  listAccounts: { fields: [list({ fields: accountFields, labelKey: 'name', label: 'Accounts' })] },
  user: {
    fields: [
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'name', label: 'Name' },
      { key: 'time_zone', label: 'Time Zone' },
    ],
  },
  subscriber: { fields: subscriberFields },
  findSubscriber: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'subscriber', label: 'Subscriber', children: subscriberFields },
    ],
  },
  subscriberPage: { fields: [list({ fields: subscriberFields, labelKey: 'email', label: 'Subscribers' }), ...pageFields] },
  deleteSubscriber: {
    fields: [
      { key: 'subscriber', label: 'Subscriber' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean', description: 'True when Drip had no such subscriber.' },
    ],
  },
  campaignSubscriptionPage: { fields: [list({ fields: campaignSubscriptionFields, labelKey: 'campaign_id', label: 'Subscriptions' }), ...pageFields] },
  batchUpsert: {
    fields: [
      { key: 'submitted', label: 'Subscribers Submitted', format: 'number' },
      { key: 'accepted', label: 'Accepted for Processing', format: 'boolean' },
    ],
  },
  stringList: { fields: [{ key: 'items', label: 'Items' }] },
  stringPage: { fields: [{ key: 'items', label: 'Items' }, ...pageFields] },
  applyTag: {
    fields: [
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'tag', label: 'Tag' },
      { key: 'applied', label: 'Applied', format: 'boolean' },
    ],
  },
  removeTag: {
    fields: [
      { key: 'subscriberId', label: 'Subscriber ID' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'tag', label: 'Tag' },
      { key: 'wasApplied', label: 'Tag Was Applied', format: 'boolean' },
      { key: 'removed', label: 'Removed', format: 'boolean' },
    ],
  },
  campaign: { fields: campaignFields },
  campaignPage: { fields: [list({ fields: campaignFields, labelKey: 'name', label: 'Email Series' }), ...pageFields] },
  workflow: { fields: workflowFields },
  workflowPage: { fields: [list({ fields: workflowFields, labelKey: 'name', label: 'Workflows' }), ...pageFields] },
  broadcast: { fields: broadcastFields },
  broadcastPage: { fields: [list({ fields: broadcastFields, labelKey: 'name', label: 'Broadcasts' }), ...pageFields] },
  conversion: { fields: conversionFields },
  conversionPage: { fields: [list({ fields: conversionFields, labelKey: 'name', label: 'Conversions' }), ...pageFields] },
  form: { fields: formFields },
  formList: { fields: [list({ fields: formFields, labelKey: 'headline', label: 'Forms' })] },
  campaignSubscribe: {
    fields: [
      { key: 'campaignId', label: 'Campaign ID' },
      { key: 'subscriber', label: 'Subscriber', children: subscriberFields },
    ],
  },
  workflowStart: {
    fields: [
      { key: 'workflowId', label: 'Workflow ID' },
      { key: 'subscriber', label: 'Subscriber', children: subscriberFields },
    ],
  },
  workflowRemove: {
    fields: [
      { key: 'workflowId', label: 'Workflow ID' },
      { key: 'subscriber', label: 'Subscriber' },
      { key: 'removed', label: 'Removed', format: 'boolean' },
    ],
  },
  recordEvent: {
    fields: [
      { key: 'subscriber', label: 'Subscriber' },
      { key: 'action', label: 'Event Action' },
      { key: 'occurredAt', label: 'Occurred At', format: 'datetime' },
      { key: 'recorded', label: 'Recorded', format: 'boolean' },
    ],
  },
  recordOrder: {
    fields: [
      { key: 'requestId', label: 'Drip Request ID' },
      { key: 'orderId', label: 'Order ID' },
      { key: 'action', label: 'Order Action' },
      { key: 'accepted', label: 'Accepted', format: 'boolean' },
    ],
  },
  recordCart: {
    fields: [
      { key: 'requestId', label: 'Drip Request ID' },
      { key: 'cartId', label: 'Cart ID' },
      { key: 'action', label: 'Cart Action' },
      { key: 'accepted', label: 'Accepted', format: 'boolean' },
    ],
  },
  legacySubscribersResponse: {
    fields: [
      { key: 'status', label: 'HTTP Status', format: 'number' },
      { key: 'subscribers', label: 'Subscribers', value: 'body.subscribers', labelKey: 'email', listItems: subscriberFields },
    ],
  },
  legacyEmptyResponse: {
    fields: [{ key: 'status', label: 'HTTP Status', format: 'number', description: '201 when Drip accepted the tag.' }],
  },
  subscriberEvent: webhookEvent([]),
  tagEvent: webhookEvent([{ key: 'tag', label: 'Tag' }]),
  campaignEvent: webhookEvent([
    { key: 'campaign_id', label: 'Campaign ID' },
    { key: 'campaign_name', label: 'Campaign Name' },
  ]),
  customEvent: {
    fields: [
      ...webhookEvent([]).fields.filter((field) => field.key !== 'properties'),
      { key: 'action', label: 'Event Action', value: 'data.properties.action' },
      { key: 'properties', label: 'Event Properties', value: 'data.properties', dynamicKey: true },
    ],
  },
  clickEvent: webhookEvent([
    { key: 'url', label: 'Clicked URL', format: 'url' },
    { key: 'email_subject', label: 'Email Subject' },
    { key: 'email_id', label: 'Email ID' },
    { key: 'delivery_id', label: 'Delivery ID' },
  ]),
} satisfies Record<string, OutputSchema>;

function list({ fields, labelKey, label = 'Items' }: { fields: Fields; labelKey: string; label?: string }): Fields[number] {
  return { key: 'items', label, labelKey, listItems: fields };
}

function webhookEvent(properties: Fields): OutputSchema {
  return {
    fields: [
      { key: 'event', label: 'Event' },
      { key: 'occurred_at', label: 'Occurred At', format: 'datetime' },
      { key: 'account_id', label: 'Account ID', value: 'data.account_id' },
      { key: 'subscriber', label: 'Subscriber', value: 'data.subscriber', children: webhookSubscriberFields },
      { key: 'properties', label: 'Details', value: 'data.properties', children: [...properties, ...webhookCauseFields] },
    ],
  };
}
