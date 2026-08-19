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
