import { FieldFormat, OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function field({ key, label, format }: { key: string; label: string; format?: FieldFormat }): OutputSchemaField {
  return format ? { key, label, format } : { key, label };
}

function list({ key, label, labelKey, items }: { key: string; label: string; labelKey: string; items: OutputSchemaField[] }): OutputSchemaField {
  return { key, label, labelKey, listItems: items };
}

function object({ key, label, children }: { key: string; label: string; children: OutputSchemaField[] }): OutputSchemaField {
  return { key, label, children };
}

function paging(): OutputSchemaField[] {
  return [
    field({ key: 'total_entries', label: 'Total Results', format: 'number' }),
    field({ key: 'page', label: 'Page', format: 'number' }),
    field({ key: 'per_page', label: 'Results Per Page', format: 'number' }),
    field({ key: 'has_more', label: 'Has More Pages', format: 'boolean' }),
  ];
}

function personSearchFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Person ID' }),
    field({ key: 'first_name', label: 'First Name' }),
    field({ key: 'last_name_obfuscated', label: 'Last Name (Obfuscated)' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'organization_name', label: 'Organization Name' }),
    field({ key: 'has_email', label: 'Has Email', format: 'boolean' }),
    field({ key: 'has_direct_phone', label: 'Has Direct Phone' }),
    field({ key: 'has_city', label: 'Has City', format: 'boolean' }),
    field({ key: 'has_state', label: 'Has State', format: 'boolean' }),
    field({ key: 'has_country', label: 'Has Country', format: 'boolean' }),
    field({ key: 'last_refreshed_at', label: 'Last Refreshed At', format: 'datetime' }),
  ];
}

function personFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Person ID' }),
    field({ key: 'first_name', label: 'First Name' }),
    field({ key: 'last_name', label: 'Last Name' }),
    field({ key: 'name', label: 'Full Name' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'headline', label: 'Headline' }),
    field({ key: 'email', label: 'Email', format: 'email' }),
    field({ key: 'email_status', label: 'Email Status' }),
    field({ key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' }),
    field({ key: 'twitter_url', label: 'Twitter URL', format: 'url' }),
    field({ key: 'github_url', label: 'GitHub URL', format: 'url' }),
    field({ key: 'facebook_url', label: 'Facebook URL', format: 'url' }),
    field({ key: 'photo_url', label: 'Photo', format: 'image' }),
    field({ key: 'city', label: 'City' }),
    field({ key: 'state', label: 'State' }),
    field({ key: 'country', label: 'Country' }),
    field({ key: 'seniority', label: 'Seniority' }),
    field({ key: 'departments', label: 'Departments' }),
    field({ key: 'organization_id', label: 'Organization ID' }),
    field({ key: 'organization_name', label: 'Organization Name' }),
    field({ key: 'organization_domain', label: 'Organization Domain' }),
    field({ key: 'contact_id', label: 'Contact ID' }),
  ];
}

function organizationFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Organization ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'primary_domain', label: 'Primary Domain' }),
    field({ key: 'website_url', label: 'Website', format: 'url' }),
    field({ key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' }),
    field({ key: 'twitter_url', label: 'Twitter URL', format: 'url' }),
    field({ key: 'facebook_url', label: 'Facebook URL', format: 'url' }),
    field({ key: 'logo_url', label: 'Logo', format: 'image' }),
    field({ key: 'phone', label: 'Phone' }),
    field({ key: 'founded_year', label: 'Founded Year', format: 'number' }),
    field({ key: 'industry', label: 'Industry' }),
    field({ key: 'keywords', label: 'Keywords' }),
    field({ key: 'estimated_num_employees', label: 'Estimated Employees', format: 'number' }),
    field({ key: 'annual_revenue', label: 'Annual Revenue', format: 'number' }),
    field({ key: 'annual_revenue_printed', label: 'Annual Revenue (Text)' }),
    field({ key: 'total_funding', label: 'Total Funding', format: 'number' }),
    field({ key: 'total_funding_printed', label: 'Total Funding (Text)' }),
    field({ key: 'latest_funding_stage', label: 'Latest Funding Stage' }),
    field({ key: 'latest_funding_round_date', label: 'Latest Funding Round Date', format: 'datetime' }),
    field({ key: 'raw_address', label: 'Address' }),
    field({ key: 'city', label: 'City' }),
    field({ key: 'state', label: 'State' }),
    field({ key: 'country', label: 'Country' }),
    field({ key: 'short_description', label: 'Description' }),
    field({ key: 'technology_names', label: 'Technologies' }),
    field({ key: 'publicly_traded_symbol', label: 'Stock Symbol' }),
    field({ key: 'account_id', label: 'Account ID' }),
  ];
}

function organizationSearchFields(): OutputSchemaField[] {
  return [
    field({ key: 'organization_id', label: 'Organization ID' }),
    field({ key: 'account_id', label: 'Account ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'primary_domain', label: 'Primary Domain' }),
    field({ key: 'website_url', label: 'Website', format: 'url' }),
    field({ key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' }),
    field({ key: 'logo_url', label: 'Logo', format: 'image' }),
    field({ key: 'founded_year', label: 'Founded Year', format: 'number' }),
    field({ key: 'phone', label: 'Phone' }),
  ];
}

function contactFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Contact ID' }),
    field({ key: 'first_name', label: 'First Name' }),
    field({ key: 'last_name', label: 'Last Name' }),
    field({ key: 'name', label: 'Full Name' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'email', label: 'Email', format: 'email' }),
    field({ key: 'email_status', label: 'Email Status' }),
    field({ key: 'phone', label: 'Phone' }),
    field({ key: 'organization_name', label: 'Organization Name' }),
    field({ key: 'organization_id', label: 'Organization ID' }),
    field({ key: 'account_id', label: 'Account ID' }),
    field({ key: 'contact_stage_id', label: 'Contact Stage ID' }),
    field({ key: 'owner_id', label: 'Owner ID' }),
    field({ key: 'person_id', label: 'Person ID' }),
    field({ key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' }),
    field({ key: 'present_raw_address', label: 'Address' }),
    field({ key: 'city', label: 'City' }),
    field({ key: 'state', label: 'State' }),
    field({ key: 'country', label: 'Country' }),
    field({ key: 'time_zone', label: 'Time Zone' }),
    field({ key: 'source', label: 'Source' }),
    field({ key: 'list_ids', label: 'List IDs' }),
    field({ key: 'sequence_ids', label: 'Sequence IDs' }),
    field({ key: 'typed_custom_fields', label: 'Custom Field Values' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'updated_at', label: 'Updated At', format: 'datetime' }),
    field({ key: 'last_activity_date', label: 'Last Activity At', format: 'datetime' }),
  ];
}

function accountFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Account ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'domain', label: 'Domain' }),
    field({ key: 'organization_id', label: 'Organization ID' }),
    field({ key: 'account_stage_id', label: 'Account Stage ID' }),
    field({ key: 'owner_id', label: 'Owner ID' }),
    field({ key: 'phone', label: 'Phone' }),
    field({ key: 'raw_address', label: 'Address' }),
    field({ key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' }),
    field({ key: 'source', label: 'Source' }),
    field({ key: 'list_ids', label: 'List IDs' }),
    field({ key: 'typed_custom_fields', label: 'Custom Field Values' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  ];
}

function dealFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Deal ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'amount', label: 'Amount', format: 'number' }),
    field({ key: 'currency', label: 'Currency' }),
    field({ key: 'owner_id', label: 'Owner ID' }),
    field({ key: 'account_id', label: 'Account ID' }),
    field({ key: 'account_name', label: 'Account Name' }),
    field({ key: 'opportunity_stage_id', label: 'Stage ID' }),
    field({ key: 'opportunity_pipeline_id', label: 'Pipeline ID' }),
    field({ key: 'stage_name', label: 'Stage Name' }),
    field({ key: 'closed_date', label: 'Close Date', format: 'date' }),
    field({ key: 'is_closed', label: 'Closed', format: 'boolean' }),
    field({ key: 'is_won', label: 'Won', format: 'boolean' }),
    field({ key: 'deal_probability', label: 'Probability (%)', format: 'number' }),
    field({ key: 'forecast_category', label: 'Forecast Category' }),
    field({ key: 'source', label: 'Source' }),
    field({ key: 'typed_custom_fields', label: 'Custom Field Values' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'last_activity_date', label: 'Last Activity At', format: 'datetime' }),
  ];
}

function taskFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Task ID' }),
    field({ key: 'type', label: 'Type' }),
    field({ key: 'status', label: 'Status' }),
    field({ key: 'priority', label: 'Priority' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'note', label: 'Note' }),
    field({ key: 'due_at', label: 'Due At', format: 'datetime' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'completed_at', label: 'Completed At', format: 'datetime' }),
    field({ key: 'skipped_at', label: 'Skipped At', format: 'datetime' }),
    field({ key: 'user_id', label: 'Assignee User ID' }),
    field({ key: 'contact_id', label: 'Contact ID' }),
    field({ key: 'account_id', label: 'Account ID' }),
    field({ key: 'opportunity_id', label: 'Deal ID' }),
    field({ key: 'emailer_campaign_id', label: 'Sequence ID' }),
    field({ key: 'creator_id', label: 'Creator User ID' }),
  ];
}

function stageFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Stage ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'display_name', label: 'Display Name' }),
    field({ key: 'display_order', label: 'Order', format: 'number' }),
    field({ key: 'category', label: 'Category' }),
  ];
}

function dealStageFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Stage ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'display_order', label: 'Order', format: 'number' }),
    field({ key: 'is_won', label: 'Won Stage', format: 'boolean' }),
    field({ key: 'is_closed', label: 'Closed Stage', format: 'boolean' }),
    field({ key: 'probability', label: 'Probability (%)', format: 'number' }),
    field({ key: 'opportunity_pipeline_id', label: 'Pipeline ID' }),
    field({ key: 'type', label: 'Type' }),
  ];
}

function listFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'List ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'modality', label: 'Holds (contacts/accounts)' }),
    field({ key: 'cached_count', label: 'Record Count', format: 'number' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'updated_at', label: 'Updated At', format: 'datetime' }),
    field({ key: 'user_id', label: 'Owner User ID' }),
  ];
}

function sequenceFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Sequence ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'active', label: 'Active', format: 'boolean' }),
    field({ key: 'archived', label: 'Archived', format: 'boolean' }),
    field({ key: 'num_steps', label: 'Steps', format: 'number' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'last_used_at', label: 'Last Used At', format: 'datetime' }),
    field({ key: 'user_id', label: 'Owner User ID' }),
    field({ key: 'unique_scheduled', label: 'Scheduled', format: 'number' }),
    field({ key: 'unique_delivered', label: 'Delivered', format: 'number' }),
    field({ key: 'unique_opened', label: 'Opened', format: 'number' }),
    field({ key: 'unique_replied', label: 'Replied', format: 'number' }),
    field({ key: 'unique_bounced', label: 'Bounced', format: 'number' }),
  ];
}

function emailAccountFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Email Account ID' }),
    field({ key: 'user_id', label: 'User ID' }),
    field({ key: 'email', label: 'Email', format: 'email' }),
    field({ key: 'type', label: 'Type' }),
    field({ key: 'active', label: 'Active', format: 'boolean' }),
    field({ key: 'default', label: 'Default', format: 'boolean' }),
    field({ key: 'provider_display_name', label: 'Provider' }),
    field({ key: 'last_synced_at', label: 'Last Synced At', format: 'datetime' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'active_campaigns_count', label: 'Active Sequences', format: 'number' }),
  ];
}

function userFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'User ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'first_name', label: 'First Name' }),
    field({ key: 'last_name', label: 'Last Name' }),
    field({ key: 'email', label: 'Email', format: 'email' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'deleted', label: 'Deleted', format: 'boolean' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  ];
}

function customFieldFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Field ID' }),
    field({ key: 'label', label: 'Label' }),
    field({ key: 'modality', label: 'Record Type' }),
    field({ key: 'type', label: 'Field Type' }),
    field({ key: 'source', label: 'Source' }),
  ];
}

function jobPostingFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Job Posting ID' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'url', label: 'URL', format: 'url' }),
    field({ key: 'city', label: 'City' }),
    field({ key: 'state', label: 'State' }),
    field({ key: 'country', label: 'Country' }),
    field({ key: 'posted_at', label: 'Posted At', format: 'datetime' }),
    field({ key: 'last_seen_at', label: 'Last Seen At', format: 'datetime' }),
  ];
}

function newsFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Article ID' }),
    field({ key: 'title', label: 'Title' }),
    field({ key: 'url', label: 'URL', format: 'url' }),
    field({ key: 'domain', label: 'Source Domain' }),
    field({ key: 'snippet', label: 'Snippet' }),
    field({ key: 'published_at', label: 'Published At', format: 'datetime' }),
    field({ key: 'event_categories', label: 'Categories' }),
    field({ key: 'organization_ids', label: 'Organization IDs' }),
  ];
}

function outreachEmailFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Email ID' }),
    field({ key: 'subject', label: 'Subject' }),
    field({ key: 'status', label: 'Status' }),
    field({ key: 'type', label: 'Type' }),
    field({ key: 'contact_id', label: 'Contact ID' }),
    field({ key: 'account_id', label: 'Account ID' }),
    field({ key: 'emailer_campaign_id', label: 'Sequence ID' }),
    field({ key: 'campaign_name', label: 'Sequence Name' }),
    field({ key: 'emailer_step_id', label: 'Sequence Step ID' }),
    field({ key: 'user_id', label: 'User ID' }),
    field({ key: 'email_account_id', label: 'Email Account ID' }),
    field({ key: 'from_email', label: 'From Email', format: 'email' }),
    field({ key: 'from_name', label: 'From Name' }),
    field({ key: 'to_email', label: 'To Email', format: 'email' }),
    field({ key: 'to_name', label: 'To Name' }),
    field({ key: 'due_at', label: 'Due At', format: 'datetime' }),
    field({ key: 'completed_at', label: 'Sent At', format: 'datetime' }),
    field({ key: 'failed_at', label: 'Failed At', format: 'datetime' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'replied', label: 'Replied', format: 'boolean' }),
    field({ key: 'reply_class', label: 'Reply Class' }),
    field({ key: 'bounce', label: 'Bounced', format: 'boolean' }),
    field({ key: 'not_sent_reason', label: 'Not Sent Reason' }),
    field({ key: 'failure_reason', label: 'Failure Reason' }),
  ];
}

function callFields(): OutputSchemaField[] {
  return [
    field({ key: 'id', label: 'Call ID' }),
    field({ key: 'user_id', label: 'User ID' }),
    field({ key: 'contact_id', label: 'Contact ID' }),
    field({ key: 'account_id', label: 'Account ID' }),
    field({ key: 'opportunity_id', label: 'Deal ID' }),
    field({ key: 'inbound', label: 'Inbound', format: 'boolean' }),
    field({ key: 'status', label: 'Status' }),
    field({ key: 'from_number', label: 'From Number' }),
    field({ key: 'to_number', label: 'To Number' }),
    field({ key: 'start_time', label: 'Started At', format: 'datetime' }),
    field({ key: 'end_time', label: 'Ended At', format: 'datetime' }),
    field({ key: 'duration', label: 'Duration (s)', format: 'number' }),
    field({ key: 'phone_call_outcome_id', label: 'Outcome ID' }),
    field({ key: 'phone_call_purpose_id', label: 'Purpose ID' }),
    field({ key: 'note_text', label: 'Note' }),
    field({ key: 'conversation_id', label: 'Conversation ID' }),
  ];
}

function rawPeopleSearch(): OutputSchema {
  return {
    fields: [
      list({ key: 'people', label: 'People', labelKey: 'first_name', items: [...personSearchFields().filter((item) => item.key !== 'organization_name'), object({ key: 'organization', label: 'Organization', children: [field({ key: 'name', label: 'Name' })] })] }),
      object({
        key: 'pagination',
        label: 'Pagination',
        children: [
          field({ key: 'page', label: 'Page', format: 'number' }),
          field({ key: 'per_page', label: 'Results Per Page', format: 'number' }),
          field({ key: 'total_entries', label: 'Total Results', format: 'number' }),
        ],
      }),
      field({ key: 'total_entries', label: 'Total Results', format: 'number' }),
    ],
  };
}

function rawOrganizationSearch(): OutputSchema {
  const rawOrganization = [
    field({ key: 'id', label: 'ID' }),
    field({ key: 'name', label: 'Name' }),
    field({ key: 'primary_domain', label: 'Primary Domain' }),
    field({ key: 'website_url', label: 'Website', format: 'url' }),
    field({ key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' }),
    field({ key: 'founded_year', label: 'Founded Year', format: 'number' }),
    field({ key: 'logo_url', label: 'Logo', format: 'image' }),
  ];
  return {
    fields: [
      list({ key: 'organizations', label: 'Organizations', labelKey: 'name', items: rawOrganization }),
      list({ key: 'accounts', label: 'Saved Accounts', labelKey: 'name', items: [...rawOrganization, field({ key: 'organization_id', label: 'Organization ID' })] }),
      object({
        key: 'pagination',
        label: 'Pagination',
        children: [
          field({ key: 'page', label: 'Page', format: 'number' }),
          field({ key: 'per_page', label: 'Results Per Page', format: 'number' }),
          field({ key: 'total_entries', label: 'Total Results', format: 'number' }),
          field({ key: 'total_pages', label: 'Total Pages', format: 'number' }),
        ],
      }),
    ],
  };
}

function rawNewsSearch(): OutputSchema {
  return {
    fields: [
      list({ key: 'news_articles', label: 'Articles', labelKey: 'title', items: newsFields() }),
      object({
        key: 'pagination',
        label: 'Pagination',
        children: [
          field({ key: 'page', label: 'Page', format: 'number' }),
          field({ key: 'per_page', label: 'Results Per Page', format: 'number' }),
          field({ key: 'total_entries', label: 'Total Results', format: 'number' }),
          field({ key: 'total_pages', label: 'Total Pages', format: 'number' }),
        ],
      }),
    ],
  };
}

function rawJobPostings(): OutputSchema {
  return {
    fields: [{ key: 'job_postings', label: 'Job Postings', value: '', listItems: jobPostingFields() }],
    itemLabel: '{title}',
  };
}

function rawPerson(): OutputSchema {
  return {
    fields: [
      ...personFields().filter((item) => !['organization_name', 'organization_domain'].includes(item.key)),
      object({ key: 'organization', label: 'Organization', children: [field({ key: 'name', label: 'Name' }), field({ key: 'primary_domain', label: 'Primary Domain' })] }),
    ],
  };
}

function rawOrganization(): OutputSchema {
  return { fields: organizationFields().filter((item) => item.key !== 'phone') };
}

function searchResult({ key, label, labelKey, items }: { key: string; label: string; labelKey: string; items: OutputSchemaField[] }): OutputSchema {
  return { fields: [...paging(), list({ key, label, labelKey, items })] };
}

function wrapped({ key, label, children }: { key: string; label: string; children: OutputSchemaField[] }): OutputSchema {
  return { fields: [object({ key, label, children })] };
}

export const apolloOutputSchemas = {
  rawPerson: rawPerson(),
  rawOrganization: rawOrganization(),
  rawPeopleSearch: rawPeopleSearch(),
  rawOrganizationSearch: rawOrganizationSearch(),
  rawNewsSearch: rawNewsSearch(),
  rawJobPostings: rawJobPostings(),
  peopleSearch: searchResult({ key: 'people', label: 'People', labelKey: 'first_name', items: personSearchFields() }),
  personEnrichment: {
    fields: [field({ key: 'found', label: 'Found', format: 'boolean' }), field({ key: 'match_confidence', label: 'Match Confidence' }), object({ key: 'person', label: 'Person', children: personFields() })],
  },
  organizationSearch: searchResult({ key: 'organizations', label: 'Organizations', labelKey: 'name', items: organizationSearchFields() }),
  organizationEnrichment: { fields: [field({ key: 'found', label: 'Found', format: 'boolean' }), object({ key: 'organization', label: 'Organization', children: organizationFields() })] },
  jobPostings: {
    fields: [
      field({ key: 'organization_id', label: 'Organization ID' }),
      field({ key: 'page', label: 'Page', format: 'number' }),
      field({ key: 'per_page', label: 'Results Per Page', format: 'number' }),
      field({ key: 'has_more', label: 'Has More Pages', format: 'boolean' }),
      list({ key: 'job_postings', label: 'Job Postings', labelKey: 'title', items: jobPostingFields() }),
    ],
  },
  newsSearch: searchResult({ key: 'articles', label: 'Articles', labelKey: 'title', items: newsFields() }),
  creditUsage: {
    fields: [
      field({ key: 'user_id', label: 'User ID' }),
      field({ key: 'team_id', label: 'Team ID' }),
      field({ key: 'email', label: 'Email', format: 'email' }),
      field({ key: 'name', label: 'Name' }),
      object({
        key: 'credits',
        label: 'Credits',
        children: [
          field({ key: 'remaining', label: 'Remaining', format: 'number' }),
          field({ key: 'lead_limit', label: 'Lead Credits (Cycle)', format: 'number' }),
          field({ key: 'lead_used', label: 'Lead Credits Used', format: 'number' }),
          field({ key: 'direct_dial_limit', label: 'Direct Dial Credits (Cycle)', format: 'number' }),
          field({ key: 'direct_dial_used', label: 'Direct Dial Credits Used', format: 'number' }),
          field({ key: 'export_limit', label: 'Export Credits (Cycle)', format: 'number' }),
          field({ key: 'export_used', label: 'Export Credits Used', format: 'number' }),
          field({ key: 'ai_limit', label: 'AI Credits (Cycle)', format: 'number' }),
          field({ key: 'ai_used', label: 'AI Credits Used', format: 'number' }),
          field({ key: 'total_used', label: 'Total Credits Used', format: 'number' }),
        ],
      }),
    ],
  },
  contactSearch: searchResult({ key: 'contacts', label: 'Contacts', labelKey: 'name', items: contactFields() }),
  contactFound: {
    fields: [field({ key: 'found', label: 'Found', format: 'boolean' }), object({ key: 'contact', label: 'Contact', children: contactFields() }), field({ key: 'other_contact_ids', label: 'Other Matching Contact IDs' })],
  },
  contact: wrapped({ key: 'contact', label: 'Contact', children: contactFields() }),
  contactCreated: {
    fields: [
      object({ key: 'contact', label: 'Contact', children: contactFields() }),
      field({ key: 'created', label: 'Created New Contact', format: 'boolean' }),
      object({
        key: 'dedupe',
        label: 'Duplicate Check',
        children: [field({ key: 'found_existing', label: 'Found Existing', format: 'boolean' }), field({ key: 'existing_contact_id', label: 'Existing Contact ID' })],
      }),
    ],
  },
  stages: { fields: [list({ key: 'stages', label: 'Stages', labelKey: 'name', items: stageFields() })] },
  dealStages: { fields: [list({ key: 'stages', label: 'Stages', labelKey: 'name', items: dealStageFields() })] },
  accountSearch: searchResult({ key: 'accounts', label: 'Accounts', labelKey: 'name', items: accountFields() }),
  account: wrapped({ key: 'account', label: 'Account', children: accountFields() }),
  lists: { fields: [list({ key: 'lists', label: 'Lists', labelKey: 'name', items: listFields() })] },
  list: wrapped({ key: 'list', label: 'List', children: listFields() }),
  listMembership: {
    fields: [
      object({ key: 'list', label: 'List', children: listFields() }),
      field({ key: 'modality', label: 'Record Type' }),
      field({ key: 'requested_ids', label: 'Requested Record IDs' }),
    ],
  },
  sequenceSearch: searchResult({ key: 'sequences', label: 'Sequences', labelKey: 'name', items: sequenceFields() }),
  emailAccounts: { fields: [list({ key: 'email_accounts', label: 'Email Accounts', labelKey: 'email', items: emailAccountFields() })] },
  sequenceAdd: {
    fields: [
      field({ key: 'sequence_id', label: 'Sequence ID' }),
      field({ key: 'status', label: 'Initial Status' }),
      field({ key: 'added_contact_ids', label: 'Added Contact IDs' }),
      list({ key: 'skipped', label: 'Skipped Contacts', labelKey: 'contact_id', items: [field({ key: 'contact_id', label: 'Contact ID' }), field({ key: 'reason', label: 'Reason' }), field({ key: 'already_in_sequence', label: 'Already in This Sequence', format: 'boolean' })] }),
    ],
  },
  sequenceRemove: {
    fields: [
      field({ key: 'mode', label: 'Mode' }),
      field({ key: 'sequence_ids', label: 'Sequence IDs' }),
      field({ key: 'contact_ids', label: 'Contact IDs' }),
      field({ key: 'job_id', label: 'Apollo Job ID' }),
    ],
  },
  users: searchResult({ key: 'users', label: 'Users', labelKey: 'name', items: userFields() }),
  task: wrapped({ key: 'task', label: 'Task', children: taskFields() }),
  taskSearch: searchResult({ key: 'tasks', label: 'Tasks', labelKey: 'title', items: taskFields() }),
  dealSearch: searchResult({ key: 'deals', label: 'Deals', labelKey: 'name', items: dealFields() }),
  deal: wrapped({ key: 'deal', label: 'Deal', children: dealFields() }),
  customFields: { fields: [list({ key: 'fields', label: 'Custom Fields', labelKey: 'label', items: customFieldFields() })] },
  outreachEmailSearch: searchResult({ key: 'emails', label: 'Emails', labelKey: 'subject', items: outreachEmailFields() }),
  emailContent: {
    fields: [
      list({
        key: 'emails',
        label: 'Emails',
        labelKey: 'subject',
        items: [
          field({ key: 'id', label: 'Email ID' }),
          field({ key: 'subject', label: 'Subject' }),
          field({ key: 'body', label: 'Body' }),
          field({ key: 'body_format', label: 'Body Format' }),
          field({ key: 'status', label: 'Status' }),
          field({ key: 'sent_at', label: 'Sent At', format: 'datetime' }),
          field({ key: 'recipients', label: 'Recipients' }),
        ],
      }),
    ],
  },
  emailSendStatus: {
    fields: [
      field({ key: 'id', label: 'Email ID' }),
      field({ key: 'status', label: 'Status' }),
      field({ key: 'message', label: 'Message' }),
      field({ key: 'completed_at', label: 'Sent At', format: 'datetime' }),
      field({ key: 'not_sent_reason', label: 'Not Sent Reason' }),
      field({ key: 'failure_reason', label: 'Failure Reason' }),
      field({ key: 'failed_at', label: 'Failed At', format: 'datetime' }),
      field({ key: 'retry_after_seconds', label: 'Retry After (s)', format: 'number' }),
    ],
  },
  callSearch: searchResult({ key: 'calls', label: 'Calls', labelKey: 'id', items: callFields() }),
  contactItem: { fields: contactFields() },
  accountItem: { fields: accountFields() },
  humanContact: { fields: [object({ key: 'contact', label: 'Contact', children: contactFields() }), list({ key: 'labels', label: 'Lists', labelKey: 'name', items: listFields() })] },
  humanAccount: { fields: [object({ key: 'account', label: 'Account', children: accountFields() })] },
  humanDeal: { fields: [object({ key: 'deal', label: 'Deal', children: dealFields() })] },
  humanTask: { fields: [object({ key: 'task', label: 'Task', children: taskFields() })] },
  customApiCall: {
    fields: [
      { key: 'status', label: 'Status Code', format: 'number' },
      { key: 'headers', label: 'Headers', dynamicKey: true },
      { key: 'body', label: 'Body' },
    ],
  },
} satisfies Record<string, OutputSchema>;
