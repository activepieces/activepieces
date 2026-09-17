import { OutputSchema } from '@activepieces/pieces-framework';

// Most actions return response.body, so their paths are bare. send_email is the one
// exception: it returns the whole HttpResponse, so every path there is body.*.

const contactFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'unsubscribed', label: 'Unsubscribed', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const domainFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Domain ID' },
  { key: 'name', label: 'Domain Name' },
  { key: 'status', label: 'Status' },
  { key: 'region', label: 'Region' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'sending', label: 'Sending Capability' },
  { key: 'receiving', label: 'Receiving Capability' },
];

const audienceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Audience ID' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const emailRowFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Email ID' },
  { key: 'from', label: 'From' },
  { key: 'to', label: 'To', description: 'Recipients, comma-separated.' },
  { key: 'subject', label: 'Subject' },
  { key: 'last_event', label: 'Last Event', description: 'Latest delivery state, e.g. delivered, bounced, scheduled.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'scheduled_at', label: 'Scheduled At', description: 'Send time for a scheduled email, empty otherwise.' },
  { key: 'cc', label: 'CC', description: 'CC recipients, comma-separated.' },
  { key: 'bcc', label: 'BCC', description: 'BCC recipients, comma-separated.' },
  { key: 'reply_to', label: 'Reply To', description: 'Reply-to addresses, comma-separated.' },
];

// send_email returns the full HttpResponse. Only the id is worth surfacing — status and
// headers are transport, and the headers carry x-resend-*-quota.
export const sendEmailOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Email ID', value: 'body.id' }],
};

export const sendBatchEmailsOutputSchema: OutputSchema = {
  itemLabel: 'Email {id}',
  fields: [
    {
      key: 'emails',
      label: 'Sent Emails',
      value: '',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'Email ID' }],
    },
  ],
};

export const getEmailStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Email ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'from', label: 'From' },
    { key: 'to', label: 'To', description: 'Recipient addresses, as a list of strings.' },
    { key: 'cc', label: 'CC', description: 'CC addresses as a list of strings, or empty when none were set.' },
    { key: 'bcc', label: 'BCC', description: 'BCC addresses as a list of strings, or empty when none were set.' },
    { key: 'reply_to', label: 'Reply To', description: 'Reply-to addresses, as a list of strings.' },
    { key: 'last_event', label: 'Last Event', description: 'Latest delivery state, e.g. delivered, bounced, scheduled.' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime', description: 'Send time for a scheduled email, null otherwise.' },
    { key: 'message_id', label: 'Message ID', description: 'RFC 5322 Message-ID assigned by the sending infrastructure.' },
    { key: 'text', label: 'Text Body' },
    { key: 'html', label: 'HTML Body', format: 'html' },
  ],
};

export const listEmailsOutputSchema: OutputSchema = {
  itemLabel: '{subject}',
  fields: [
    { key: 'emails', label: 'Emails', value: '', labelKey: 'subject', listItems: emailRowFields },
  ],
};

export const cancelScheduledEmailOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Email ID' }],
};

export const rescheduleEmailOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Email ID' }],
};

export const createAudienceOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Audience ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const listAudiencesOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'audiences', label: 'Audiences', value: '', labelKey: 'name', listItems: audienceFields },
  ],
};

export const deleteAudienceOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Audience ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const createContactOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Contact ID' }],
};

export const updateContactOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Contact ID' }],
};

// delete_contact answers with `contact`, not `id`, unlike the other deletes.
export const deleteContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'contact', label: 'Contact ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const listContactsOutputSchema: OutputSchema = {
  itemLabel: '{email}',
  fields: [
    { key: 'contacts', label: 'Contacts', value: '', labelKey: 'email', listItems: contactFields },
  ],
};

export const createDomainOutputSchema: OutputSchema = {
  fields: [
    ...domainFields,
    {
      key: 'dns_records',
      label: 'DNS Records',
      labelKey: 'name',
      description: 'Records to add at your DNS provider before the domain will verify.',
      listItems: [
        { key: 'record', label: 'Record Purpose', description: 'DKIM or SPF.' },
        { key: 'name', label: 'Host' },
        { key: 'type', label: 'DNS Type', description: 'TXT or MX.' },
        { key: 'value', label: 'Value' },
        { key: 'ttl', label: 'TTL' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority', format: 'number', description: 'Set on MX records only.' },
      ],
    },
  ],
};

export const verifyDomainOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Domain ID' }],
};

export const deleteDomainOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Domain ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const listDomainsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'domains', label: 'Domains', value: '', labelKey: 'name', listItems: domainFields },
  ],
};

const broadcastFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Broadcast ID' },
  { key: 'name', label: 'Name' },
  { key: 'audience_id', label: 'Audience ID' },
  { key: 'status', label: 'Status' },
  { key: 'reply_to', label: 'Reply To' },
  { key: 'preview_text', label: 'Preview Text' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  // Empty strings until the broadcast is scheduled or sent, rather than absent keys.
  { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
  { key: 'sent_at', label: 'Sent At', format: 'datetime' },
];

export const createBroadcastOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Broadcast ID' }],
};

export const sendBroadcastOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Broadcast ID' }],
};

export const deleteBroadcastOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Broadcast ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const listBroadcastsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'broadcasts', label: 'Broadcasts', value: '', labelKey: 'name', listItems: broadcastFields },
  ],
};

export const getContactOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Contact ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'unsubscribed', label: 'Unsubscribed', format: 'boolean' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    {
      key: 'properties',
      label: 'Custom Properties',
      description: 'Custom contact-property values, keyed by property name.',
    },
  ],
};

// Resend's response calls the segment id `audienceId` here (legacy naming); `id` is the contact.
export const addContactToSegmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Contact ID' },
    { key: 'audienceId', label: 'Segment ID' },
  ],
};

export const removeContactFromSegmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Contact ID' },
    { key: 'audienceId', label: 'Segment ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const segmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Segment ID' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const listContactSegmentsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'segments', label: 'Segments', value: '', labelKey: 'name', listItems: segmentFields },
  ],
};

export const listContactTopicsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'topics',
      label: 'Topics',
      value: '',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Topic ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'subscription', label: 'Subscription', description: 'opt_in or opt_out for this contact.' },
      ],
    },
  ],
};

const contactPropertyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Contact Property ID' },
  { key: 'key', label: 'Key' },
  { key: 'type', label: 'Type' },
  { key: 'fallback_value', label: 'Fallback Value' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const createContactPropertyOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Contact Property ID' }],
};

export const getContactPropertyOutputSchema: OutputSchema = {
  fields: contactPropertyFields,
};

export const listContactPropertiesOutputSchema: OutputSchema = {
  itemLabel: '{key}',
  fields: [
    { key: 'properties', label: 'Contact Properties', value: '', labelKey: 'key', listItems: contactPropertyFields },
  ],
};

export const updateContactPropertyOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Contact Property ID' }],
};

export const deleteContactPropertyOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Contact Property ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const createSegmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Segment ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const getSegmentOutputSchema: OutputSchema = {
  fields: segmentFields,
};

export const listSegmentsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'segments', label: 'Segments', value: '', labelKey: 'name', listItems: segmentFields },
  ],
};

export const deleteSegmentOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Segment ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const topicFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Topic ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'default_subscription', label: 'Default Subscription' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const createTopicOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Topic ID' }],
};

export const getTopicOutputSchema: OutputSchema = {
  fields: topicFields,
};

export const listTopicsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'topics', label: 'Topics', value: '', labelKey: 'name', listItems: topicFields },
  ],
};

export const updateTopicOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Topic ID' }],
};

export const deleteTopicOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Topic ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const templateListFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Template ID' },
  { key: 'name', label: 'Name' },
  { key: 'alias', label: 'Alias' },
  { key: 'status', label: 'Status' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const createTemplateOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Template ID' }],
};

export const getTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Template ID' },
    { key: 'current_version_id', label: 'Current Version ID' },
    { key: 'alias', label: 'Alias' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'from', label: 'From' },
    { key: 'subject', label: 'Subject' },
    { key: 'reply_to', label: 'Reply To' },
    { key: 'html', label: 'HTML Body', format: 'html' },
    { key: 'text', label: 'Text Body' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
    { key: 'published_at', label: 'Published At', format: 'datetime' },
    { key: 'has_unpublished_versions', label: 'Has Unpublished Versions', format: 'boolean' },
    {
      key: 'variables',
      label: 'Variables',
      labelKey: 'key',
      listItems: [
        { key: 'key', label: 'Key' },
        { key: 'type', label: 'Type' },
        { key: 'fallback_value', label: 'Fallback Value' },
      ],
    },
  ],
};

export const listTemplatesOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'templates', label: 'Templates', value: '', labelKey: 'name', listItems: templateListFields },
  ],
};

export const updateTemplateOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Template ID' }],
};

export const deleteTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Template ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const publishTemplateOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Template ID' }],
};

export const duplicateTemplateOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Template ID' }],
};

const webhookFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Webhook ID' },
  { key: 'endpoint', label: 'Endpoint URL' },
  { key: 'status', label: 'Status' },
  { key: 'events', label: 'Events', description: 'Event types this webhook is subscribed to.' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const createWebhookOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Webhook ID' },
    {
      key: 'signing_secret',
      label: 'Signing Secret',
      description: 'Secret used to verify webhook payloads. Store it securely.',
    },
  ],
};

export const getWebhookOutputSchema: OutputSchema = {
  fields: webhookFields,
};

export const listWebhooksOutputSchema: OutputSchema = {
  itemLabel: '{endpoint}',
  fields: [
    { key: 'webhooks', label: 'Webhooks', value: '', labelKey: 'endpoint', listItems: webhookFields },
  ],
};

export const updateWebhookOutputSchema: OutputSchema = {
  fields: [{ key: 'id', label: 'Webhook ID' }],
};

export const deleteWebhookOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Webhook ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

const emailAttachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'filename', label: 'Filename' },
  { key: 'size', label: 'Size (bytes)', format: 'number' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'download_url', label: 'Download URL' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
];

export const getEmailAttachmentOutputSchema: OutputSchema = {
  fields: emailAttachmentFields,
};

export const listEmailAttachmentsOutputSchema: OutputSchema = {
  itemLabel: '{filename}',
  fields: [
    { key: 'attachments', label: 'Attachments', value: '', labelKey: 'filename', listItems: emailAttachmentFields },
  ],
};

export const listReceivedEmailsOutputSchema: OutputSchema = {
  itemLabel: '{subject}',
  fields: [
    {
      key: 'emails',
      label: 'Received Emails',
      value: '',
      labelKey: 'subject',
      listItems: [
        { key: 'id', label: 'Email ID' },
        { key: 'from', label: 'From' },
        { key: 'to', label: 'To', description: 'Recipients, comma-separated.' },
        { key: 'subject', label: 'Subject' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'cc', label: 'CC', description: 'CC recipients, comma-separated.' },
        { key: 'bcc', label: 'BCC', description: 'BCC recipients, comma-separated.' },
        { key: 'reply_to', label: 'Reply To', description: 'Reply-to addresses, comma-separated.' },
      ],
    },
  ],
};
