import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const memberSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Subscriber Hash' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'status', label: 'Status' },
  { key: 'list_id', label: 'Audience ID' },
  { key: 'member_rating', label: 'Member Rating', format: 'number' },
  { key: 'vip', label: 'VIP', format: 'boolean' },
  { key: 'language', label: 'Language' },
  { key: 'timestamp_signup', label: 'Signed Up At', format: 'datetime' },
  { key: 'last_changed', label: 'Last Changed', format: 'datetime' },
  { key: 'merge_fields', label: 'Merge Fields', dynamicKey: true },
  { key: 'tags', label: 'Tags', labelKey: 'name', listItems: [{ key: 'id', label: 'Tag ID', format: 'number' }, { key: 'name', label: 'Tag' }] },
];

const memberFields: OutputSchemaField[] = [
  { key: 'id', label: 'Subscriber Hash' },
  { key: 'email_address', label: 'Email', format: 'email' },
  { key: 'unique_email_id', label: 'Unique Email ID' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'web_id', label: 'Web ID', format: 'number' },
  { key: 'email_type', label: 'Email Type' },
  { key: 'status', label: 'Status' },
  { key: 'merge_fields', label: 'Merge Fields', dynamicKey: true },
  { key: 'interests', label: 'Interests', dynamicKey: true },
  {
    key: 'stats',
    label: 'Stats',
    children: [
      { key: 'avg_open_rate', label: 'Average Open Rate', format: 'number' },
      { key: 'avg_click_rate', label: 'Average Click Rate', format: 'number' },
    ],
  },
  { key: 'timestamp_signup', label: 'Signed Up At', format: 'datetime' },
  { key: 'timestamp_opt', label: 'Opted In At', format: 'datetime' },
  { key: 'member_rating', label: 'Member Rating', format: 'number' },
  { key: 'last_changed', label: 'Last Changed', format: 'datetime' },
  { key: 'language', label: 'Language' },
  { key: 'vip', label: 'VIP', format: 'boolean' },
  { key: 'source', label: 'Source' },
  { key: 'tags_count', label: 'Tag Count', format: 'number' },
  { key: 'tags', label: 'Tags', listItems: [{ key: 'id', label: 'Tag ID' }, { key: 'name', label: 'Tag' }], labelKey: 'name' },
  { key: 'list_id', label: 'Audience ID' },
];

const campaignSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Campaign ID' },
  { key: 'web_id', label: 'Web ID', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'title', label: 'Title' },
  { key: 'subject_line', label: 'Subject Line' },
  { key: 'list_id', label: 'Audience ID' },
  { key: 'emails_sent', label: 'Emails Sent', format: 'number' },
  { key: 'create_time', label: 'Created At', format: 'datetime' },
  { key: 'send_time', label: 'Sent At', format: 'datetime' },
  { key: 'archive_url', label: 'Archive URL', format: 'url' },
];

const pagingFields: OutputSchemaField[] = [
  { key: 'total_items', label: 'Total Items', format: 'number' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
];

const resolveTailFields: OutputSchemaField[] = [
  { key: 'ambiguous', label: 'Ambiguous', format: 'boolean' },
  { key: 'candidates', label: 'Other Matches' },
];

const webhookBaseFields: OutputSchemaField[] = [
  { key: 'type', label: 'Event Type' },
  { key: 'fired_at', label: 'Fired At', format: 'datetime' },
  { key: 'trigger_type', label: 'Trigger Type' },
  { key: 'event_category', label: 'Event Category' },
  { key: 'processed_at', label: 'Processed At', format: 'datetime' },
];

const webhookMemberDataFields: OutputSchemaField[] = [
  { key: 'id', label: 'Subscriber ID' },
  { key: 'web_id', label: 'Web ID' },
  { key: 'list_id', label: 'Audience ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'email_type', label: 'Email Type' },
  { key: 'ip_opt', label: 'Opt-in IP' },
  { key: 'ip_signup', label: 'Signup IP' },
  { key: 'merges', label: 'Merge Fields', dynamicKey: true },
];

function triggerSchema({ dataFields, extraFields = [] }: { dataFields: OutputSchemaField[]; extraFields?: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [...webhookBaseFields, { key: 'data', label: 'Event Data', children: dataFields }, ...extraFields],
  };
}

export const mailchimpOutputSchemas = {
  addMemberToList: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      ...memberFields,
      { key: 'tags_applied', label: 'Tags Applied' },
    ],
  },
  member: { fields: memberFields },
  addNote: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'note_id', label: 'Note ID', format: 'number' },
      { key: 'note_content', label: 'Note' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
  },
  tagChange: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'data', label: 'Response' },
    ],
  },
  createCampaign: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'campaign_id', label: 'Campaign ID' },
      { key: 'campaign_web_id', label: 'Web ID', format: 'number' },
      { key: 'campaign_title', label: 'Title' },
      { key: 'campaign_subject', label: 'Subject Line' },
      { key: 'campaign_status', label: 'Status' },
      { key: 'campaign_type', label: 'Type' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'archive_url', label: 'Archive URL', format: 'url' },
    ],
  },
  campaignReport: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      {
        key: 'summary',
        label: 'Summary',
        children: [
          { key: 'campaign_title', label: 'Campaign Title' },
          { key: 'subject_line', label: 'Subject Line' },
          { key: 'emails_sent', label: 'Emails Sent', format: 'number' },
          { key: 'unique_opens', label: 'Unique Opens', format: 'number' },
          { key: 'unique_clicks', label: 'Unique Clicks', format: 'number' },
          { key: 'open_rate', label: 'Open Rate', format: 'number' },
          { key: 'click_rate', label: 'Click Rate', format: 'number' },
          { key: 'bounce_rate', label: 'Bounce Rate (%)', format: 'number' },
          { key: 'unsub_rate', label: 'Unsubscribe Rate (%)', format: 'number' },
          { key: 'abuse_rate', label: 'Abuse Rate (%)', format: 'number' },
        ],
      },
      {
        key: 'report',
        label: 'Report',
        children: [
          { key: 'id', label: 'Campaign ID' },
          { key: 'campaign_title', label: 'Campaign Title' },
          { key: 'type', label: 'Type' },
          { key: 'list_id', label: 'Audience ID' },
          { key: 'list_name', label: 'Audience Name' },
          { key: 'emails_sent', label: 'Emails Sent', format: 'number' },
          { key: 'unsubscribed', label: 'Unsubscribed', format: 'number' },
          { key: 'abuse_reports', label: 'Abuse Reports', format: 'number' },
          { key: 'send_time', label: 'Sent At', format: 'datetime' },
        ],
      },
      { key: 'error', label: 'Error' },
      { key: 'message', label: 'Message' },
    ],
  },
  createAudience: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'id', label: 'Audience ID' },
      { key: 'web_id', label: 'Web ID', format: 'number' },
      { key: 'name', label: 'Name' },
      { key: 'permission_reminder', label: 'Permission Reminder' },
      { key: 'date_created', label: 'Created At', format: 'datetime' },
      { key: 'subscribe_url_short', label: 'Subscribe URL', format: 'url' },
      { key: 'double_optin', label: 'Double Opt-in', format: 'boolean' },
      {
        key: 'campaign_defaults',
        label: 'Campaign Defaults',
        children: [
          { key: 'from_name', label: 'From Name' },
          { key: 'from_email', label: 'From Email', format: 'email' },
          { key: 'subject', label: 'Subject' },
          { key: 'language', label: 'Language' },
        ],
      },
    ],
  },
  archiveSubscriber: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'subscriber_hash', label: 'Subscriber Hash' },
      { key: 'already_archived', label: 'Already Archived', format: 'boolean' },
      { key: 'archived_at', label: 'Archived At', format: 'datetime' },
      { key: 'error', label: 'Error' },
    ],
  },
  unsubscribeEmail: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'total_created', label: 'Created', format: 'number' },
      { key: 'total_updated', label: 'Updated', format: 'number' },
      { key: 'error_count', label: 'Error Count', format: 'number' },
      {
        key: 'updated_members',
        label: 'Updated Members',
        listItems: [
          { key: 'id', label: 'Subscriber Hash' },
          { key: 'email_address', label: 'Email', format: 'email' },
          { key: 'status', label: 'Status' },
        ],
        labelKey: 'email_address',
      },
      {
        key: 'new_members',
        label: 'New Members',
        listItems: [
          { key: 'id', label: 'Subscriber Hash' },
          { key: 'email_address', label: 'Email', format: 'email' },
          { key: 'status', label: 'Status' },
        ],
        labelKey: 'email_address',
      },
    ],
  },
  findCampaign: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'query', label: 'Query' },
      { key: 'total_items', label: 'Total Items', format: 'number' },
      {
        key: 'results',
        label: 'Results',
        listItems: [
          {
            key: 'campaign',
            label: 'Campaign',
            children: [
              { key: 'id', label: 'Campaign ID' },
              { key: 'type', label: 'Type' },
              { key: 'status', label: 'Status' },
              { key: 'create_time', label: 'Created At', format: 'datetime' },
              { key: 'send_time', label: 'Sent At', format: 'datetime' },
              { key: 'archive_url', label: 'Archive URL', format: 'url' },
            ],
          },
        ],
      },
    ],
  },
  findCustomer: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'store_id', label: 'Store ID' },
      { key: 'search_email', label: 'Search Email', format: 'email' },
      { key: 'found_customers', label: 'Customers Found', format: 'number' },
      { key: 'total_items', label: 'Total Items', format: 'number' },
      {
        key: 'customers',
        label: 'Customers',
        labelKey: 'email_address',
        listItems: [
          { key: 'id', label: 'Customer ID' },
          { key: 'email_address', label: 'Email', format: 'email' },
          { key: 'first_name', label: 'First Name' },
          { key: 'last_name', label: 'Last Name' },
          { key: 'company', label: 'Company' },
          { key: 'opt_in_status', label: 'Opted In', format: 'boolean' },
          { key: 'orders_count', label: 'Orders', format: 'number' },
          { key: 'total_spent', label: 'Total Spent', format: 'number' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
  findTag: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'search_query', label: 'Search Query' },
      { key: 'found_tags', label: 'Tags Found', format: 'number' },
      { key: 'total_items', label: 'Total Items', format: 'number' },
      { key: 'tags', label: 'Tags', labelKey: 'name', listItems: [{ key: 'id', label: 'Tag ID', format: 'number' }, { key: 'name', label: 'Name' }] },
    ],
  },
  findSubscriber: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'search_query', label: 'Search Query', format: 'email' },
      { key: 'search_scope', label: 'Search Scope' },
      { key: 'total_matches', label: 'Total Matches', format: 'number' },
      {
        key: 'primary_subscriber',
        label: 'Primary Subscriber',
        children: [
          { key: 'id', label: 'Subscriber Hash' },
          { key: 'email_address', label: 'Email', format: 'email' },
          { key: 'status', label: 'Status' },
          { key: 'list_id', label: 'Audience ID' },
          { key: 'list_name', label: 'Audience Name' },
          { key: 'full_name', label: 'Full Name' },
          { key: 'company', label: 'Company' },
          { key: 'phone', label: 'Phone' },
          { key: 'member_since', label: 'Member Since', format: 'datetime' },
          { key: 'last_activity', label: 'Last Activity', format: 'datetime' },
          { key: 'member_rating', label: 'Member Rating', format: 'number' },
          { key: 'vip_status', label: 'VIP Status' },
        ],
      },
      {
        key: 'subscribers',
        label: 'Subscribers',
        labelKey: 'list_id',
        listItems: [
          { key: 'id', label: 'Subscriber Hash' },
          { key: 'email_address', label: 'Email', format: 'email' },
          { key: 'status', label: 'Status' },
          { key: 'list_id', label: 'Audience ID' },
          { key: 'list_name', label: 'Audience Name' },
          { key: 'merge_fields', label: 'Merge Fields', dynamicKey: true },
          { key: 'last_changed', label: 'Last Changed', format: 'datetime' },
        ],
      },
      { key: 'message', label: 'Message' },
    ],
  },
  createTag: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      {
        key: 'tag',
        label: 'Tag',
        children: [
          { key: 'id', label: 'Tag ID', format: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'list_id', label: 'Audience ID' },
          { key: 'type', label: 'Type' },
          { key: 'member_count', label: 'Member Count', format: 'number' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
  sendCampaign: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'campaign_id', label: 'Campaign ID' },
    ],
  },
  createCustomEvent: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'message', label: 'Message' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'name', label: 'Event Name' },
    ],
  },
  listAudiences: {
    fields: [
      {
        key: 'audiences',
        label: 'Audiences',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Audience ID' },
          { key: 'name', label: 'Name' },
          { key: 'web_id', label: 'Web ID', format: 'number' },
          { key: 'member_count', label: 'Members', format: 'number' },
          { key: 'unsubscribe_count', label: 'Unsubscribed', format: 'number' },
          { key: 'date_created', label: 'Created At', format: 'datetime' },
        ],
      },
      ...pagingFields,
    ],
  },
  getAudience: {
    fields: [
      { key: 'id', label: 'Audience ID' },
      { key: 'name', label: 'Name' },
      { key: 'web_id', label: 'Web ID', format: 'number' },
      { key: 'date_created', label: 'Created At', format: 'datetime' },
      { key: 'permission_reminder', label: 'Permission Reminder' },
      { key: 'double_optin', label: 'Double Opt-in', format: 'boolean' },
      { key: 'subscribe_url_short', label: 'Subscribe URL', format: 'url' },
      { key: 'from_name', label: 'Default From Name' },
      { key: 'from_email', label: 'Default From Email', format: 'email' },
      { key: 'member_count', label: 'Members', format: 'number' },
      { key: 'unsubscribe_count', label: 'Unsubscribed', format: 'number' },
      { key: 'cleaned_count', label: 'Cleaned', format: 'number' },
      { key: 'campaign_count', label: 'Campaigns', format: 'number' },
      { key: 'open_rate', label: 'Open Rate', format: 'number' },
      { key: 'click_rate', label: 'Click Rate', format: 'number' },
      { key: 'last_sub_date', label: 'Last Subscribe', format: 'datetime' },
    ],
  },
  memberList: {
    fields: [
      { key: 'members', label: 'Members', labelKey: 'email_address', listItems: memberSummaryFields },
      ...pagingFields,
    ],
  },
  searchMembers: {
    fields: [
      { key: 'exact_matches', label: 'Exact Matches', labelKey: 'email_address', listItems: memberSummaryFields },
      { key: 'full_search', label: 'Other Matches', labelKey: 'email_address', listItems: memberSummaryFields },
      { key: 'exact_total', label: 'Exact Total', format: 'number' },
      { key: 'full_total', label: 'Other Total', format: 'number' },
    ],
  },
  memberTags: {
    fields: [
      {
        key: 'tags',
        label: 'Tags',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Tag ID', format: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'date_added', label: 'Added At', format: 'datetime' },
        ],
      },
      { key: 'total_items', label: 'Total Items', format: 'number' },
    ],
  },
  memberActivity: {
    fields: [
      {
        key: 'activity',
        label: 'Activity',
        labelKey: 'activity_type',
        listItems: [
          { key: 'activity_type', label: 'Type' },
          { key: 'created_at_timestamp', label: 'At', format: 'datetime' },
          { key: 'campaign_id', label: 'Campaign ID' },
          { key: 'campaign_title', label: 'Campaign Title' },
          { key: 'link_clicked', label: 'Link Clicked', format: 'url' },
        ],
      },
      { key: 'total_items', label: 'Total Items', format: 'number' },
    ],
  },
  memberDeleted: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
  mergeFields: {
    fields: [
      {
        key: 'merge_fields',
        label: 'Merge Fields',
        labelKey: 'name',
        listItems: [
          { key: 'merge_id', label: 'Merge ID', format: 'number' },
          { key: 'tag', label: 'Merge Tag' },
          { key: 'name', label: 'Label' },
          { key: 'type', label: 'Type' },
          { key: 'required', label: 'Required', format: 'boolean' },
          { key: 'default_value', label: 'Default Value' },
          { key: 'choices', label: 'Choices' },
        ],
      },
      { key: 'total_items', label: 'Total Items', format: 'number' },
    ],
  },
  interestCategories: {
    fields: [
      {
        key: 'categories',
        label: 'Categories',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Category ID' },
          { key: 'title', label: 'Title' },
          { key: 'type', label: 'Type' },
          {
            key: 'interests',
            label: 'Interests',
            labelKey: 'name',
            listItems: [
              { key: 'id', label: 'Interest ID' },
              { key: 'name', label: 'Name' },
              { key: 'subscriber_count', label: 'Subscribers', format: 'number' },
            ],
          },
        ],
      },
    ],
  },
  segments: {
    fields: [
      {
        key: 'segments',
        label: 'Segments',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Segment ID', format: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'member_count', label: 'Members', format: 'number' },
          { key: 'created_at', label: 'Created At', format: 'datetime' },
          { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        ],
      },
      ...pagingFields,
    ],
  },
  segmentMemberAdded: {
    fields: [
      { key: 'id', label: 'Subscriber Hash' },
      { key: 'email_address', label: 'Email', format: 'email' },
      { key: 'status', label: 'Status' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'segment_id', label: 'Segment ID' },
    ],
  },
  segmentMemberRemoved: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'segment_id', label: 'Segment ID' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
  campaignList: {
    fields: [
      { key: 'campaigns', label: 'Campaigns', labelKey: 'title', listItems: campaignSummaryFields },
      ...pagingFields,
    ],
  },
  campaign: { fields: campaignSummaryFields },
  campaignContent: {
    fields: [
      { key: 'campaign_id', label: 'Campaign ID' },
      { key: 'html', label: 'HTML', format: 'html' },
      { key: 'plain_text', label: 'Plain Text' },
    ],
  },
  campaignAction: {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'campaign_id', label: 'Campaign ID' },
      { key: 'schedule_time', label: 'Scheduled For', format: 'datetime' },
      { key: 'test_emails', label: 'Test Recipients' },
    ],
  },
  templates: {
    fields: [
      {
        key: 'templates',
        label: 'Templates',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Template ID', format: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'type', label: 'Type' },
          { key: 'category', label: 'Category' },
          { key: 'active', label: 'Active', format: 'boolean' },
          { key: 'date_created', label: 'Created At', format: 'datetime' },
          { key: 'date_edited', label: 'Edited At', format: 'datetime' },
          { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
        ],
      },
      ...pagingFields,
    ],
  },
  aiMember: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'id', label: 'Subscriber Hash' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'status', label: 'Status' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'full_name', label: 'Full Name' },
      { key: 'language', label: 'Language' },
      { key: 'vip', label: 'VIP', format: 'boolean' },
      { key: 'member_rating', label: 'Member Rating', format: 'number' },
      { key: 'tags', label: 'Tags' },
      { key: 'merge_fields', label: 'Merge Fields', dynamicKey: true },
      { key: 'timestamp_signup', label: 'Signed Up At', format: 'datetime' },
      { key: 'last_changed', label: 'Last Changed', format: 'datetime' },
    ],
  },
  aiMemberWrite: {
    fields: [
      { key: 'id', label: 'Subscriber Hash' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'status', label: 'Status' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'last_changed', label: 'Last Changed', format: 'datetime' },
      { key: 'tags_applied', label: 'Tags Applied' },
    ],
  },
  aiCampaignDraft: {
    fields: [
      { key: 'id', label: 'Campaign ID' },
      { key: 'web_id', label: 'Web ID', format: 'number' },
      { key: 'status', label: 'Status' },
      { key: 'title', label: 'Title' },
      { key: 'subject_line', label: 'Subject Line' },
      { key: 'list_id', label: 'Audience ID' },
      { key: 'segment_id', label: 'Segment ID' },
      { key: 'archive_url', label: 'Archive URL', format: 'url' },
    ],
  },
  aiCampaignStats: {
    fields: [
      { key: 'campaign_id', label: 'Campaign ID' },
      { key: 'title', label: 'Title' },
      { key: 'send_time', label: 'Sent At', format: 'datetime' },
      { key: 'emails_sent', label: 'Emails Sent', format: 'number' },
      { key: 'opens', label: 'Opens', format: 'number' },
      { key: 'unique_opens', label: 'Unique Opens', format: 'number' },
      { key: 'open_rate', label: 'Open Rate', format: 'number' },
      { key: 'clicks', label: 'Clicks', format: 'number' },
      { key: 'unique_clicks', label: 'Unique Clicks', format: 'number' },
      { key: 'click_rate', label: 'Click Rate', format: 'number' },
      { key: 'unsubscribes', label: 'Unsubscribes', format: 'number' },
      { key: 'bounces', label: 'Bounces', format: 'number' },
    ],
  },
  resolveAudience: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'id', label: 'Audience ID' },
      { key: 'name', label: 'Name' },
      { key: 'member_count', label: 'Members', format: 'number' },
      ...resolveTailFields,
    ],
  },
  resolveSegment: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'id', label: 'Segment ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'member_count', label: 'Members', format: 'number' },
      ...resolveTailFields,
    ],
  },
  resolveMergeField: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'tag', label: 'Merge Tag' },
      { key: 'name', label: 'Label' },
      { key: 'merge_id', label: 'Merge ID', format: 'number' },
      { key: 'type', label: 'Type' },
      { key: 'required', label: 'Required', format: 'boolean' },
      ...resolveTailFields,
    ],
  },
  resolveInterest: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'id', label: 'Interest ID' },
      { key: 'name', label: 'Name' },
      { key: 'category_id', label: 'Category ID' },
      { key: 'category_title', label: 'Category' },
      ...resolveTailFields,
    ],
  },
  triggerMember: triggerSchema({ dataFields: webhookMemberDataFields, extraFields: [
    { key: 'subscription_summary', label: 'Subscription Summary' },
    { key: 'business_context', label: 'Business Context' },
  ] }),
  triggerUnsubscribe: triggerSchema({ dataFields: [
    ...webhookMemberDataFields,
    { key: 'reason', label: 'Reason' },
    { key: 'campaign_id', label: 'Campaign ID' },
  ], extraFields: [
    { key: 'unsubscribe_summary', label: 'Unsubscribe Summary' },
    { key: 'business_context', label: 'Business Context' },
    { key: 'retention_insights', label: 'Retention Insights' },
  ] }),
  triggerProfile: triggerSchema({ dataFields: [
    ...webhookMemberDataFields,
    { key: 'new_email', label: 'New Email', format: 'email' },
    { key: 'old_email', label: 'Old Email', format: 'email' },
  ], extraFields: [{ key: 'subscriber_summary', label: 'Subscriber Summary' }] }),
  triggerCampaign: triggerSchema({ dataFields: [
    { key: 'id', label: 'Campaign ID' },
    { key: 'list_id', label: 'Audience ID' },
    { key: 'subject', label: 'Subject' },
    { key: 'status', label: 'Status' },
    { key: 'reason', label: 'Reason' },
  ], extraFields: [
    {
      key: 'campaign_summary',
      label: 'Campaign Summary',
      children: [
        { key: 'campaign_id', label: 'Campaign ID' },
        { key: 'campaign_subject', label: 'Subject' },
        { key: 'campaign_status', label: 'Status' },
        { key: 'list_id', label: 'Audience ID' },
        { key: 'event_timestamp', label: 'Event Time', format: 'datetime' },
        { key: 'delivery_status', label: 'Delivery Status' },
      ],
    },
    { key: 'campaign_insights', label: 'Campaign Insights' },
  ] }),
  triggerClick: triggerSchema({ dataFields: [
    { key: 'id', label: 'Subscriber ID' },
    { key: 'list_id', label: 'Audience ID' },
    { key: 'campaign_id', label: 'Campaign ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'ip', label: 'IP' },
    { key: 'timestamp', label: 'Clicked At', format: 'datetime' },
  ] }),
  triggerOpen: triggerSchema({ dataFields: [
    { key: 'id', label: 'Subscriber ID' },
    { key: 'list_id', label: 'Audience ID' },
    { key: 'campaign_id', label: 'Campaign ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'ip', label: 'IP' },
    { key: 'timestamp', label: 'Opened At', format: 'datetime' },
  ] }),
  triggerCustomer: triggerSchema({ dataFields: [
    { key: 'id', label: 'Customer ID' },
    { key: 'store_id', label: 'Store ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'company', label: 'Company' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ] }),
  triggerOrder: triggerSchema({ dataFields: [
    { key: 'id', label: 'Order ID' },
    { key: 'store_id', label: 'Store ID' },
    { key: 'customer_id', label: 'Customer ID' },
    { key: 'customer_email', label: 'Customer Email', format: 'email' },
    { key: 'order_total', label: 'Order Total', format: 'number' },
    { key: 'currency', label: 'Currency' },
    { key: 'order_status', label: 'Status' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ] }),
  triggerSegmentTag: triggerSchema({ dataFields: [
    ...webhookMemberDataFields,
    { key: 'segment_id', label: 'Segment ID' },
    { key: 'segment_name', label: 'Segment Name' },
    { key: 'tag_name', label: 'Tag Name' },
  ] }),
} satisfies Record<string, OutputSchema>;
