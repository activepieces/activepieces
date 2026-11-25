import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const campaignSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Campaign ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Created', format: 'datetime' },
  { key: 'updated_at', label: 'Updated', format: 'datetime' },
  { key: 'client_id', label: 'Client ID', format: 'number' },
];

const leadFields: OutputSchemaField[] = [
  { key: 'id', label: 'Lead ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company_name', label: 'Company' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'location', label: 'Location' },
  { key: 'linkedin_profile', label: 'LinkedIn', format: 'url' },
  { key: 'custom_fields', label: 'Custom Fields', dynamicKey: true },
];

const createCampaign: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Campaign ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'created_at', label: 'Created', format: 'datetime' },
  ],
};

const addLeads: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'upload_count', label: 'Uploaded', format: 'number' },
    { key: 'total_leads', label: 'Total Leads Sent', format: 'number' },
    { key: 'already_added_to_campaign', label: 'Already in Campaign', format: 'number' },
    { key: 'duplicate_count', label: 'Duplicates', format: 'number' },
    { key: 'invalid_email_count', label: 'Invalid Emails', format: 'number' },
    { key: 'unsubscribed_leads', label: 'Unsubscribed Leads' },
    { key: 'block_count', label: 'Blocked', format: 'number' },
  ],
};

const campaignStatistics: OutputSchema = {
  fields: [
    { key: 'id', label: 'Campaign ID', format: 'number' },
    { key: 'name', label: 'Name' },
    { key: 'status', label: 'Status' },
    { key: 'created_at', label: 'Created', format: 'datetime' },
    { key: 'sent_count', label: 'Sent' },
    { key: 'unique_sent_count', label: 'Unique Sent' },
    { key: 'open_count', label: 'Opens' },
    { key: 'unique_open_count', label: 'Unique Opens' },
    { key: 'click_count', label: 'Clicks' },
    { key: 'unique_click_count', label: 'Unique Clicks' },
    { key: 'reply_count', label: 'Replies' },
    { key: 'bounce_count', label: 'Bounces' },
    { key: 'unsubscribed_count', label: 'Unsubscribed' },
    { key: 'total_count', label: 'Total Leads' },
    { key: 'campaign_lead_stats', label: 'Lead Stats', dynamicKey: true },
  ],
};

const updateCampaignSettings: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'updated', label: 'Settings Sent', dynamicKey: true },
  ],
};

const listCampaigns: OutputSchema = {
  fields: [
    { key: 'campaigns', label: 'Campaigns', labelKey: 'name', listItems: campaignSummaryFields },
  ],
};

const campaign: OutputSchema = {
  fields: [
    ...campaignSummaryFields,
    { key: 'track_settings', label: 'Tracking Disabled For' },
    { key: 'stop_lead_settings', label: 'Stop Lead Condition' },
    { key: 'scheduler_cron_value', label: 'Schedule' },
    { key: 'min_time_btwn_emails', label: 'Minutes Between Emails', format: 'number' },
    { key: 'max_leads_per_day', label: 'Max Leads Per Day', format: 'number' },
    { key: 'follow_up_percentage', label: 'Follow Up Percentage', format: 'number' },
    { key: 'unsubscribe_text', label: 'Unsubscribe Text' },
    { key: 'send_as_plain_text', label: 'Plain Text', format: 'boolean' },
    { key: 'enable_ai_esp_matching', label: 'AI ESP Matching', format: 'boolean' },
  ],
};

const updateCampaignStatus: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'status', label: 'Status' },
  ],
};

const deleteCampaign: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
  ],
};

const listCampaignLeads: OutputSchema = {
  fields: [
    { key: 'total_leads', label: 'Total Leads' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    {
      key: 'leads',
      label: 'Leads',
      labelKey: 'lead.email',
      listItems: [
        { key: 'campaign_lead_map_id', label: 'Campaign Lead Map ID', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'created_at', label: 'Added', format: 'datetime' },
        { key: 'lead', label: 'Lead', children: leadFields },
      ],
    },
  ],
};

const findLeadByEmail: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'lead', label: 'Lead', children: leadFields },
  ],
};

const updateLeadStatus: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'lead_id', label: 'Lead ID', format: 'number' },
    { key: 'action', label: 'Action' },
  ],
};

const deleteLead: OutputSchema = {
  fields: [
    { key: 'ok', label: 'Success', format: 'boolean' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'lead_id', label: 'Lead ID', format: 'number' },
  ],
};

const listEmailAccounts: OutputSchema = {
  fields: [
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'limit', label: 'Limit', format: 'number' },
    {
      key: 'email_accounts',
      label: 'Email Accounts',
      labelKey: 'from_email',
      listItems: [
        { key: 'id', label: 'Email Account ID', format: 'number' },
        { key: 'from_name', label: 'From Name' },
        { key: 'from_email', label: 'From Email', format: 'email' },
        { key: 'type', label: 'Type' },
        { key: 'message_per_day', label: 'Messages Per Day', format: 'number' },
        { key: 'daily_sent_count', label: 'Sent Today', format: 'number' },
        { key: 'is_smtp_success', label: 'SMTP OK', format: 'boolean' },
        { key: 'is_imap_success', label: 'IMAP OK', format: 'boolean' },
        { key: 'client_id', label: 'Client ID', format: 'number' },
        { key: 'created_at', label: 'Created', format: 'datetime' },
      ],
    },
  ],
};

const messageHistory: OutputSchema = {
  fields: [
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'lead_id', label: 'Lead ID', format: 'number' },
    {
      key: 'history',
      label: 'Messages',
      labelKey: 'subject',
      listItems: [
        { key: 'type', label: 'Type' },
        { key: 'message_id', label: 'Message ID' },
        { key: 'time', label: 'Time', format: 'datetime' },
        { key: 'from', label: 'From', format: 'email' },
        { key: 'to', label: 'To', format: 'email' },
        { key: 'subject', label: 'Subject' },
        { key: 'email_body', label: 'Body', format: 'html' },
        { key: 'open_count', label: 'Opens', format: 'number' },
        { key: 'click_count', label: 'Clicks', format: 'number' },
      ],
    },
  ],
};

const campaignEvent: OutputSchema = {
  fields: [
    { key: 'event_type', label: 'Event Type' },
    { key: 'campaign_id', label: 'Campaign ID', format: 'number' },
    { key: 'campaign_name', label: 'Campaign Name' },
    { key: 'sl_email_lead_id', label: 'Lead ID', format: 'number' },
    { key: 'to_email', label: 'Lead Email', format: 'email' },
    { key: 'to_name', label: 'Lead Name' },
    { key: 'from_email', label: 'From Email', format: 'email' },
    { key: 'subject', label: 'Subject' },
    { key: 'event_timestamp', label: 'Time', format: 'datetime' },
  ],
};

export const smartleadOutputSchemas = {
  createCampaign,
  addLeads,
  campaignStatistics,
  updateCampaignSettings,
  listCampaigns,
  campaign,
  updateCampaignStatus,
  deleteCampaign,
  listCampaignLeads,
  findLeadByEmail,
  updateLeadStatus,
  deleteLead,
  listEmailAccounts,
  messageHistory,
  campaignEvent,
};
