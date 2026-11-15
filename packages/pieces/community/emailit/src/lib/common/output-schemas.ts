import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const trackingFields: Fields = [
  { key: 'loads', label: 'Open Tracking', format: 'boolean' },
  { key: 'clicks', label: 'Click Tracking', format: 'boolean' },
];

const sentEmailFields: Fields = [
  { key: 'id', label: 'Email ID', description: 'ID of the first recipient\'s copy. Pass it as Email ID to other Emailit steps.' },
  { key: 'ids', label: 'Email IDs by Recipient', description: 'Recipient address to email ID. Only present with more than one recipient.', dynamicKey: true },
  { key: 'object', label: 'Object' },
  { key: 'message_id', label: 'Message-ID Header' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'cc', label: 'CC' },
  { key: 'bcc', label: 'BCC' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status', description: 'accepted, or scheduled for a future send time.' },
  { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'tracking', label: 'Tracking', children: trackingFields },
];

const emailSummaryFields: Fields = [
  { key: 'id', label: 'Email ID' },
  { key: 'type', label: 'Type', description: 'outbound or inbound.' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To' },
  { key: 'subject', label: 'Subject' },
  { key: 'status', label: 'Status' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'meta', label: 'Metadata', dynamicKey: true },
];

const domainSummaryFields: Fields = [
  { key: 'id', label: 'Domain ID' },
  { key: 'name', label: 'Domain Name' },
  { key: 'verification_status', label: 'Verification Status', description: 'verified, pending or pending_review.' },
  { key: 'verified_at', label: 'Verified At', format: 'datetime' },
  { key: 'spf_status', label: 'SPF Status' },
  { key: 'dkim_status', label: 'DKIM Status' },
  { key: 'return_path_status', label: 'Return Path Status' },
  { key: 'dmarc_status', label: 'DMARC Status' },
  { key: 'tracking_status', label: 'Tracking Status' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const domainFields: Fields = [
  ...domainSummaryFields,
  { key: 'dns_checked_at', label: 'DNS Checked At', format: 'datetime' },
  { key: 'manual_review_required', label: 'Manual Review Required', format: 'boolean' },
  { key: 'spf_error', label: 'SPF Error' },
  { key: 'dkim_error', label: 'DKIM Error' },
  { key: 'return_path_error', label: 'Return Path Error' },
  { key: 'dmarc_error', label: 'DMARC Error' },
  { key: 'track_loads', label: 'Open Tracking Default', format: 'number' },
  { key: 'track_clicks', label: 'Click Tracking Default', format: 'number' },
  {
    key: 'dns_records',
    label: 'DNS Records',
    labelKey: 'name',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'name', label: 'Name' },
      { key: 'value', label: 'Value' },
      { key: 'priority', label: 'Priority', format: 'number' },
      { key: 'required', label: 'Required', format: 'boolean' },
      { key: 'status', label: 'Status' },
      { key: 'error', label: 'Error' },
    ],
  },
];

const usageFields: Fields = [
  { key: 'used', label: 'Used', format: 'number' },
  { key: 'limit', label: 'Limit', format: 'number' },
  { key: 'plan', label: 'Plan' },
];

const audienceFields: Fields = [
  { key: 'id', label: 'Audience ID' },
  { key: 'name', label: 'Name' },
  { key: 'subscribers_count', label: 'Subscribers', format: 'number' },
  { key: 'usage', label: 'Usage', children: usageFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const subscriberFields: Fields = [
  { key: 'id', label: 'Subscriber ID', description: 'sub_… ID. Pass it as Subscriber to update or remove.' },
  { key: 'audience_id', label: 'Audience ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
  { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
  { key: 'subscribed_at', label: 'Subscribed At', format: 'datetime' },
  { key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const contactFields: Fields = [
  { key: 'id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
  { key: 'unsubscribed', label: 'Unsubscribed', format: 'boolean' },
  {
    key: 'audiences',
    label: 'Audiences',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Audience ID' },
      { key: 'name', label: 'Audience Name' },
      { key: 'subscribed', label: 'Subscribed (list view)', format: 'boolean' },
      { key: 'subscriber', label: 'Membership', children: [
        { key: 'id', label: 'Subscriber ID' },
        { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
        { key: 'subscribed_at', label: 'Subscribed At', format: 'datetime' },
        { key: 'unsubscribed_at', label: 'Unsubscribed At', format: 'datetime' },
      ] },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const suppressionFields: Fields = [
  { key: 'id', label: 'Suppression ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'type', label: 'Type', description: 'recipient, bounce, complaint or unsubscribe.' },
  { key: 'reason', label: 'Reason' },
  { key: 'keep_until', label: 'Keep Until', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const templateFields: Fields = [
  { key: 'id', label: 'Template ID' },
  { key: 'name', label: 'Name' },
  { key: 'alias', label: 'Alias', description: 'Pass the alias as Template when sending to always use the published version.' },
  { key: 'subject', label: 'Subject' },
  { key: 'from', label: 'From' },
  { key: 'reply_to', label: 'Reply-To' },
  { key: 'editor', label: 'Editor' },
  { key: 'total_versions', label: 'Versions', format: 'number' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

function listOf({ items, extra = [] }: { items: Fields; extra?: Fields }): OutputSchema {
  return {
    fields: [
      { key: 'items', label: 'Items', listItems: items },
      { key: 'count', label: 'Count on This Page', format: 'number' },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'hasMore', label: 'Has More Pages', format: 'boolean', description: 'True when another page exists. Request it with Page + 1.' },
      { key: 'totalRecords', label: 'Total Records', format: 'number', description: 'Total matches across all pages, when Emailit reports it.' },
      ...extra,
    ],
  };
}

export const emailitSchemas = {
  sendEmailLegacy: {
    fields: [
      { key: 'status', label: 'HTTP Status', format: 'number' },
      { key: 'headers', label: 'Response Headers', dynamicKey: true },
      { key: 'body', label: 'Email', children: sentEmailFields },
    ],
  } satisfies OutputSchema,
  sentEmail: { fields: sentEmailFields } satisfies OutputSchema,
  email: {
    fields: [
      ...emailSummaryFields,
      { key: 'message_id', label: 'Message-ID Header' },
      { key: 'tracking', label: 'Tracking', children: trackingFields },
      { key: 'headers', label: 'Headers', dynamicKey: true },
      { key: 'body', label: 'Body', children: [
        { key: 'text', label: 'Text' },
        { key: 'html', label: 'HTML', format: 'html' },
      ] },
      {
        key: 'attachments',
        label: 'Attachments',
        labelKey: 'filename',
        listItems: [
          { key: 'filename', label: 'File Name' },
          { key: 'content_type', label: 'Content Type' },
          { key: 'size', label: 'Size', format: 'filesize' },
        ],
      },
    ],
  } satisfies OutputSchema,
  emailList: listOf({ items: emailSummaryFields }),
  rescheduled: {
    fields: [
      { key: 'id', label: 'Email ID' },
      { key: 'status', label: 'Status' },
      { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      { key: 'message', label: 'Message' },
    ],
  } satisfies OutputSchema,
  canceled: {
    fields: [
      { key: 'id', label: 'Email ID' },
      { key: 'status', label: 'Status' },
      { key: 'in_flight', label: 'Delivery May Still Complete', format: 'boolean' },
      { key: 'alreadyCanceled', label: 'Already Canceled', format: 'boolean', description: 'True when the email was canceled before this step ran.' },
      { key: 'message', label: 'Message' },
    ],
  } satisfies OutputSchema,
  retried: {
    fields: [
      { key: 'id', label: 'New Email ID' },
      { key: 'original_id', label: 'Original Email ID' },
      { key: 'from', label: 'From' },
      { key: 'to', label: 'To' },
      { key: 'subject', label: 'Subject' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'message', label: 'Message' },
    ],
  } satisfies OutputSchema,
  forwarded: {
    fields: [
      ...sentEmailFields,
      { key: 'original_id', label: 'Original Email ID' },
      { key: 'message', label: 'Message' },
    ],
  } satisfies OutputSchema,
  domainList: listOf({ items: domainSummaryFields }),
  domain: { fields: domainFields } satisfies OutputSchema,
  audienceList: listOf({ items: audienceFields }),
  subscriber: {
    fields: [...subscriberFields, { key: 'alreadySubscribed', label: 'Already Subscribed', format: 'boolean', description: 'True when the address was already an active subscriber; nothing changed.' }],
  } satisfies OutputSchema,
  subscriberUpdated: { fields: subscriberFields } satisfies OutputSchema,
  removed: {
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'audience_id', label: 'Audience ID' },
      { key: 'contact_id', label: 'Contact ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'alreadyRemoved', label: 'Already Removed', format: 'boolean', description: 'True when nothing matched, so there was nothing to remove.' },
    ],
  } satisfies OutputSchema,
  contactLookup: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'contact', label: 'Contact', children: contactFields },
    ],
  } satisfies OutputSchema,
  contactUpsert: {
    fields: [
      ...contactFields,
      { key: 'created', label: 'Created', format: 'boolean', description: 'True when a new contact was created, false when an existing one was updated.' },
    ],
  } satisfies OutputSchema,
  suppression: {
    fields: [...suppressionFields, { key: 'alreadySuppressed', label: 'Already Suppressed', format: 'boolean', description: 'True when the address already had a suppression of this type.' }],
  } satisfies OutputSchema,
  verification: {
    fields: [
      { key: 'id', label: 'Verification ID' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'status', label: 'Status' },
      { key: 'result', label: 'Result', description: 'safe, invalid, disposable, disabled, inbox_full, role or unknown.' },
      { key: 'risk', label: 'Risk', description: 'low, medium or high.' },
      { key: 'score', label: 'Score', format: 'number' },
      { key: 'mode', label: 'Mode' },
      { key: 'did_you_mean', label: 'Did You Mean' },
      { key: 'address', label: 'Address Parts', children: [
        { key: 'mailbox', label: 'Mailbox' },
        { key: 'domain', label: 'Domain' },
        { key: 'suffix', label: 'Plus Suffix' },
        { key: 'root', label: 'Root Address', format: 'email' },
      ] },
      { key: 'mx_records', label: 'MX Records', labelKey: 'exchange', listItems: [
        { key: 'priority', label: 'Priority', format: 'number' },
        { key: 'exchange', label: 'Mail Server' },
      ] },
      { key: 'created_at', label: 'Checked At', format: 'datetime' },
      { key: 'checks', label: 'Checks', children: [
        { key: 'valid_syntax', label: 'Valid Syntax', format: 'boolean' },
        { key: 'disposable', label: 'Disposable', format: 'boolean' },
        { key: 'role_account', label: 'Role Account', format: 'boolean' },
        { key: 'free_email', label: 'Free Email', format: 'boolean' },
        { key: 'gibberish', label: 'Gibberish', format: 'boolean' },
        { key: 'has_mx_records', label: 'Has MX Records', format: 'boolean' },
        { key: 'domain_age', label: 'Domain Age (days)', format: 'number' },
        { key: 'smtp_connect', label: 'SMTP Connect', format: 'boolean' },
        { key: 'deliverable', label: 'Deliverable', format: 'boolean' },
        { key: 'disabled', label: 'Disabled', format: 'boolean' },
        { key: 'inbox_full', label: 'Inbox Full', format: 'boolean' },
        { key: 'catch_all', label: 'Catch-All', format: 'boolean' },
      ] },
    ],
  } satisfies OutputSchema,
  templateList: listOf({ items: templateFields }),
};
