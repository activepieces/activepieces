import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const rateFields: Fields = [
  { key: 'float', label: 'Value', format: 'number' },
  { key: 'string', label: 'Formatted' },
];

const subscriberFields: Fields = [
  { key: 'id', label: 'Subscriber ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'sent', label: 'Emails Sent', format: 'number' },
  { key: 'opens_count', label: 'Opens Count', format: 'number' },
  { key: 'clicks_count', label: 'Clicks Count', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', format: 'number' },
  { key: 'ip_address', label: 'IP Address' },
  { key: 'subscribed_at', label: 'Subscribed At', format: 'datetime' },
  { key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'opted_in_at', label: 'Opted In At', format: 'datetime' },
  { key: 'optin_ip', label: 'Opt-in IP' },
  { key: 'fields', label: 'Fields', dynamicKey: true },
];

const subscriberWithGroupsFields: Fields = [
  ...subscriberFields,
  { key: 'groups', label: 'Group IDs' },
];

const unsubscribedSubscriberFields: Fields = [
  ...subscriberWithGroupsFields,
  { key: 'unsubscribe_reason', label: 'Unsubscribe Reason' },
];


const webhookSubscriberFields: Fields = [
  ...subscriberFields,
  { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
  { key: 'forget_at', label: 'Forget At', format: 'datetime' },
  { key: 'location', label: 'Location' },
];

const webhookEnvelopeFields: Fields = [
  { key: 'account_id', label: 'Account ID' },
  { key: 'api_version', label: 'API Version' },
];

const groupFields: Fields = [
  { key: 'id', label: 'Group ID' },
  { key: 'name', label: 'Name' },
  { key: 'active_count', label: 'Active Subscribers', format: 'number' },
  { key: 'sent_count', label: 'Emails Sent', format: 'number' },
  { key: 'opens_count', label: 'Opens Count', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', children: rateFields },
  { key: 'clicks_count', label: 'Clicks Count', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', children: rateFields },
  { key: 'unsubscribed_count', label: 'Unsubscribed', format: 'number' },
  { key: 'unconfirmed_count', label: 'Unconfirmed', format: 'number' },
  { key: 'bounced_count', label: 'Bounced', format: 'number' },
  { key: 'junk_count', label: 'Junk', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const linksFields: Fields = [
  { key: 'first', label: 'First Page URL', format: 'url' },
  { key: 'last', label: 'Last Page URL', format: 'url' },
  { key: 'prev', label: 'Previous Page URL', format: 'url' },
  { key: 'next', label: 'Next Page URL', format: 'url' },
];

const cursorMetaFields: Fields = [
  { key: 'path', label: 'Request Path', format: 'url' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'next_cursor', label: 'Next Cursor' },
  { key: 'prev_cursor', label: 'Previous Cursor' },
];

const pageMetaLinkFields: Fields = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'label', label: 'Label' },
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'active', label: 'Active', format: 'boolean' },
];

const pageMetaFields: Fields = [
  { key: 'current_page', label: 'Current Page', format: 'number' },
  { key: 'from', label: 'From', format: 'number' },
  { key: 'to', label: 'To', format: 'number' },
  { key: 'last_page', label: 'Last Page', format: 'number' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'path', label: 'Request Path', format: 'url' },
  { key: 'links', label: 'Page Links', listItems: pageMetaLinkFields, labelKey: 'label' },
];

const single = (fields: Fields): OutputSchema => ({
  fields: [{ key: 'data', label: 'Data', children: fields }],
});

const cursorList = (label: string, fields: Fields): OutputSchema => ({
  fields: [
    { key: 'data', label, listItems: fields, labelKey: 'id' },
    { key: 'links', label: 'Links', children: linksFields },
    { key: 'meta', label: 'Meta', children: cursorMetaFields },
  ],
});

const pageList = (label: string, fields: Fields): OutputSchema => ({
  fields: [
    { key: 'data', label, listItems: fields, labelKey: 'name' },
    { key: 'links', label: 'Links', children: linksFields },
    { key: 'meta', label: 'Meta', children: pageMetaFields },
  ],
});

export const findSubscriberOutputSchema: OutputSchema = single(subscriberWithGroupsFields);
export const addOrUpdateSubscriberOutputSchema: OutputSchema = single(subscriberWithGroupsFields);
export const unsubscribeSubscriberOutputSchema: OutputSchema = single(unsubscribedSubscriberFields);
export const listSubscribersOutputSchema: OutputSchema = cursorList('Subscribers', subscriberFields);

export const addSubscriberToGroupOutputSchema: OutputSchema = single(groupFields);
export const createGroupOutputSchema: OutputSchema = single(groupFields);
export const listGroupsOutputSchema: OutputSchema = pageList('Groups', groupFields);
export const listGroupSubscribersOutputSchema: OutputSchema = cursorList('Subscribers', subscriberFields);

export const deleteSubscriberOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'subscriberId', label: 'Subscriber ID' },
  ],
};

export const subscriberEventTriggerOutputSchema: OutputSchema = {
  fields: [
    ...webhookSubscriberFields,
    { key: 'event', label: 'Event' },
    ...webhookEnvelopeFields,
  ],
};

export const subscriberAddedToGroupTriggerOutputSchema: OutputSchema = {
  fields: [
    { key: 'type', label: 'Event' },
    { key: 'subscriber', label: 'Subscriber', children: webhookSubscriberFields },
    { key: 'group', label: 'Group', children: [
      { key: 'id', label: 'Group ID' },
      { key: 'name', label: 'Name' },
    ] },
    ...webhookEnvelopeFields,
  ],
};
