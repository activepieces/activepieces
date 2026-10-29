import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

export const hunterOutputSchemas = {
  leadWrapped: leadWrapped(),
  leadFlat: leadFlat(),
  leadUpdated: leadUpdated(),
  leadDeleted: leadDeleted(),
  leadSearch: leadSearch(),
  recipientsAdded: recipientsAdded(),
  recipientsRemoved: recipientsRemoved(),
  emailCount: emailCount(),
  emailFinder: emailFinder(),
  emailVerifier: emailVerifier(),
  domainSearch: domainSearch(),
  leadsList: leadsList(),
  leadsListList: leadsListList(),
  campaignList: campaignList(),
  account: account(),
  personAndCompany: personAndCompany(),
  company: company(),
};

function leadFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Lead ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'position', label: 'Position' },
    { key: 'company', label: 'Company' },
    { key: 'company_industry', label: 'Company Industry' },
    { key: 'company_size', label: 'Company Size' },
    { key: 'confidence_score', label: 'Confidence Score', format: 'number' },
    { key: 'website', label: 'Website' },
    { key: 'country_code', label: 'Country Code' },
    { key: 'source', label: 'Source' },
    { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
    { key: 'phone_number', label: 'Phone Number' },
    { key: 'twitter', label: 'Twitter Handle' },
    { key: 'sync_status', label: 'Sync Status' },
    { key: 'notes', label: 'Notes' },
    { key: 'sending_status', label: 'Sending Status' },
    { key: 'last_activity_at', label: 'Last Activity At', format: 'datetime' },
    { key: 'last_contacted_at', label: 'Last Contacted At', format: 'datetime' },
    {
      key: 'verification',
      label: 'Verification',
      children: [
        { key: 'date', label: 'Verified At', format: 'datetime' },
        { key: 'status', label: 'Verification Status' },
      ],
    },
    {
      key: 'leads_list',
      label: 'Leads List',
      children: [
        { key: 'id', label: 'List ID' },
        { key: 'name', label: 'List Name' },
        { key: 'leads_count', label: 'Leads Count', format: 'number' },
      ],
    },
    { key: 'department', label: 'Department' },
    { key: 'created_by', label: 'Created By (User ID)' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ];
}

function leadsListFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'List ID' },
    { key: 'name', label: 'Name' },
    { key: 'leads_count', label: 'Leads Count', format: 'number' },
    { key: 'type', label: 'Type' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
  ];
}

function sourceFields(): OutputSchemaField[] {
  return [
    { key: 'domain', label: 'Domain' },
    { key: 'uri', label: 'Page URL', format: 'url' },
    { key: 'extracted_on', label: 'Extracted On', format: 'date' },
    { key: 'last_seen_on', label: 'Last Seen On', format: 'date' },
    { key: 'still_on_page', label: 'Still On Page', format: 'boolean' },
  ];
}

function verificationFields(): OutputSchemaField[] {
  return [
    { key: 'date', label: 'Verified At', format: 'date' },
    { key: 'status', label: 'Status' },
  ];
}

function leadWrapped(): OutputSchema {
  return { fields: [{ key: 'lead', label: 'Lead', children: leadFields() }] };
}

function leadFlat(): OutputSchema {
  return { fields: leadFields() };
}

function leadUpdated(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'lead', label: 'Lead', children: leadFields() },
    ],
  };
}

function leadDeleted(): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'deleted', label: 'Deleted', format: 'boolean', description: 'False when the lead did not exist (already deleted).' },
      { key: 'lead_id', label: 'Lead ID' },
    ],
  };
}

function leadSearch(): OutputSchema {
  return {
    fields: [
      { key: 'leads', label: 'Leads', listItems: leadFields(), labelKey: 'email' },
      { key: 'count', label: 'Matching Leads', format: 'number', description: 'Number of leads that match the filters (across all pages).' },
      { key: 'total', label: 'Leads In Account', format: 'number', description: 'Number of leads in the account, ignoring filters.' },
      { key: 'limit', label: 'Limit', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
    ],
  };
}

function skippedFields(): OutputSchemaField[] {
  return [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'reason', label: 'Reason' },
  ];
}

function recipientsAdded(): OutputSchema {
  return {
    fields: [
      { key: 'recipients_added', label: 'Recipients Added', format: 'number' },
      { key: 'skipped_recipients', label: 'Skipped Recipients', listItems: skippedFields(), labelKey: 'email' },
    ],
  };
}

function recipientsRemoved(): OutputSchema {
  return {
    fields: [
      { key: 'recipients_removed', label: 'Removed Emails', description: 'Emails removed from a draft campaign.' },
      { key: 'recipients_canceled', label: 'Canceled Emails', description: 'Emails canceled in a started campaign.' },
      { key: 'messages_canceled', label: 'Messages Canceled', format: 'number' },
      { key: 'skipped_recipients', label: 'Skipped Recipients', listItems: skippedFields(), labelKey: 'email' },
    ],
  };
}

function emailCount(): OutputSchema {
  return {
    fields: [
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'personal_emails', label: 'Personal Emails', format: 'number' },
      { key: 'generic_emails', label: 'Generic Emails', format: 'number' },
      { key: 'department', label: 'By Department', dynamicKey: true },
      { key: 'seniority', label: 'By Seniority', dynamicKey: true },
    ],
  };
}

function emailFinder(): OutputSchema {
  return {
    fields: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'score', label: 'Confidence Score', format: 'number' },
      { key: 'domain', label: 'Domain' },
      { key: 'accept_all', label: 'Accept All', format: 'boolean' },
      { key: 'position', label: 'Position' },
      { key: 'twitter', label: 'Twitter Handle' },
      { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
      { key: 'phone_number', label: 'Phone Number' },
      { key: 'company', label: 'Company' },
      { key: 'sources', label: 'Sources', listItems: sourceFields(), labelKey: 'uri' },
      { key: 'verification', label: 'Verification', children: verificationFields() },
    ],
  };
}

function emailVerifier(): OutputSchema {
  return {
    fields: [
      { key: 'status', label: 'Status', description: 'valid, invalid, accept_all, webmail, disposable or unknown.' },
      { key: 'result', label: 'Result (deprecated)' },
      { key: 'score', label: 'Score', format: 'number' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'regexp', label: 'Valid Format', format: 'boolean' },
      { key: 'gibberish', label: 'Gibberish', format: 'boolean' },
      { key: 'disposable', label: 'Disposable', format: 'boolean' },
      { key: 'webmail', label: 'Webmail', format: 'boolean' },
      { key: 'mx_records', label: 'MX Records', format: 'boolean' },
      { key: 'smtp_server', label: 'SMTP Server', format: 'boolean' },
      { key: 'smtp_check', label: 'SMTP Check', format: 'boolean' },
      { key: 'accept_all', label: 'Accept All', format: 'boolean' },
      { key: 'block', label: 'Blocked', format: 'boolean' },
      { key: 'sources', label: 'Sources', listItems: sourceFields(), labelKey: 'uri' },
    ],
  };
}

function domainSearch(): OutputSchema {
  return {
    fields: [
      { key: 'domain', label: 'Domain' },
      { key: 'organization', label: 'Organization' },
      { key: 'pattern', label: 'Email Pattern' },
      { key: 'disposable', label: 'Disposable', format: 'boolean' },
      { key: 'webmail', label: 'Webmail', format: 'boolean' },
      { key: 'accept_all', label: 'Accept All', format: 'boolean' },
      { key: 'linked_domains', label: 'Linked Domains' },
      {
        key: 'emails',
        label: 'Emails',
        labelKey: 'value',
        listItems: [
          { key: 'value', label: 'Email', format: 'email' },
          { key: 'type', label: 'Type' },
          { key: 'source_type', label: 'Source Type' },
          { key: 'provenance', label: 'Provenance' },
          { key: 'confidence', label: 'Confidence', format: 'number' },
          { key: 'first_name', label: 'First Name' },
          { key: 'last_name', label: 'Last Name' },
          { key: 'position', label: 'Position' },
          { key: 'position_raw', label: 'Position (Raw)' },
          { key: 'seniority', label: 'Seniority' },
          { key: 'department', label: 'Department' },
          { key: 'decision_maker', label: 'Decision Maker', format: 'boolean' },
          { key: 'linkedin', label: 'LinkedIn', format: 'url' },
          { key: 'twitter', label: 'Twitter' },
          { key: 'phone_number', label: 'Phone Number' },
          { key: 'verification', label: 'Verification', children: verificationFields() },
          { key: 'sources', label: 'Sources', listItems: sourceFields(), labelKey: 'uri' },
        ],
      },
      { key: 'results', label: 'Total Emails Known', format: 'number' },
      { key: 'limit', label: 'Limit', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
    ],
  };
}

function leadsList(): OutputSchema {
  return {
    fields: [
      ...leadsListFields(),
      { key: 'leads', label: 'Leads', listItems: leadFields(), labelKey: 'email' },
    ],
  };
}

function leadsListList(): OutputSchema {
  return {
    fields: [
      { key: 'leads_lists', label: 'Leads Lists', listItems: leadsListFields(), labelKey: 'name' },
      { key: 'total', label: 'Total Lists', format: 'number' },
      { key: 'limit', label: 'Limit', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
    ],
  };
}

function campaignList(): OutputSchema {
  return {
    fields: [
      {
        key: 'campaigns',
        label: 'Campaigns',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Campaign ID' },
          { key: 'name', label: 'Name' },
          { key: 'recipients_count', label: 'Recipients Count', format: 'number' },
          { key: 'editable', label: 'Editable', format: 'boolean' },
          { key: 'started', label: 'Started', format: 'boolean' },
          { key: 'archived', label: 'Archived', format: 'boolean' },
          { key: 'paused', label: 'Paused', format: 'boolean' },
          {
            key: 'owner',
            label: 'Owner',
            children: [
              { key: 'id', label: 'Owner User ID' },
              { key: 'email', label: 'Owner Email', format: 'email' },
            ],
          },
        ],
      },
      { key: 'count', label: 'Campaigns In This Page', format: 'number', description: 'Hunter does not report a total; when count equals limit, request the next offset.' },
      { key: 'limit', label: 'Limit', format: 'number' },
      { key: 'offset', label: 'Offset', format: 'number' },
    ],
  };
}

function account(): OutputSchema {
  return {
    fields: [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'plan_name', label: 'Plan Name' },
      { key: 'plan_level', label: 'Plan Level', format: 'number' },
      { key: 'reset_date', label: 'Credits Reset Date', format: 'date' },
      { key: 'team_id', label: 'Team ID' },
      {
        key: 'requests',
        label: 'Usage',
        children: [
          {
            key: 'credits',
            label: 'Credits',
            children: [
              { key: 'used', label: 'Used', format: 'number' },
              { key: 'available', label: 'Available', format: 'number' },
              { key: 'remaining', label: 'Remaining', format: 'number' },
            ],
          },
          {
            key: 'searches',
            label: 'Searches',
            children: [
              { key: 'used', label: 'Used', format: 'number' },
              { key: 'available', label: 'Available', format: 'number' },
              { key: 'remaining', label: 'Remaining', format: 'number' },
            ],
          },
          {
            key: 'verifications',
            label: 'Verifications',
            children: [
              { key: 'used', label: 'Used', format: 'number' },
              { key: 'available', label: 'Available', format: 'number' },
              { key: 'remaining', label: 'Remaining', format: 'number' },
            ],
          },
        ],
      },
    ],
  };
}

function companyFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Company ID' },
    { key: 'name', label: 'Name' },
    { key: 'legalName', label: 'Legal Name' },
    { key: 'domain', label: 'Domain' },
    { key: 'description', label: 'Description' },
    { key: 'type', label: 'Type' },
    { key: 'phone', label: 'Phone' },
    { key: 'logo', label: 'Logo', format: 'image' },
    { key: 'tags', label: 'Tags' },
    { key: 'foundedYear', label: 'Founded Year', format: 'number' },
    { key: 'location', label: 'Location' },
    {
      key: 'category',
      label: 'Category',
      children: [
        { key: 'sector', label: 'Sector' },
        { key: 'industryGroup', label: 'Industry Group' },
        { key: 'industry', label: 'Industry' },
      ],
    },
    {
      key: 'metrics',
      label: 'Metrics',
      children: [
        { key: 'employees', label: 'Employees Range' },
        { key: 'employeesCount', label: 'Employees Count', format: 'number' },
        { key: 'raised', label: 'Funding Raised', format: 'number' },
        { key: 'estimatedAnnualRevenue', label: 'Estimated Annual Revenue' },
      ],
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      children: [{ key: 'handle', label: 'Handle' }],
    },
    { key: 'tech', label: 'Technologies' },
  ];
}

function personFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Person ID' },
    { key: 'email', label: 'Email', format: 'email' },
    {
      key: 'name',
      label: 'Name',
      children: [
        { key: 'fullName', label: 'Full Name' },
        { key: 'givenName', label: 'First Name' },
        { key: 'familyName', label: 'Last Name' },
      ],
    },
    { key: 'location', label: 'Location' },
    { key: 'timeZone', label: 'Time Zone' },
    {
      key: 'geo',
      label: 'Geo',
      children: [
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'country', label: 'Country' },
        { key: 'countryCode', label: 'Country Code' },
      ],
    },
    {
      key: 'employment',
      label: 'Employment',
      children: [
        { key: 'domain', label: 'Company Domain' },
        { key: 'name', label: 'Company Name' },
        { key: 'title', label: 'Title' },
        { key: 'role', label: 'Role' },
        { key: 'seniority', label: 'Seniority' },
      ],
    },
    {
      key: 'linkedin',
      label: 'LinkedIn',
      children: [{ key: 'handle', label: 'Handle' }],
    },
    { key: 'phone', label: 'Phone' },
  ];
}

function personAndCompany(): OutputSchema {
  return {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'person', label: 'Person', children: personFields() },
      { key: 'company', label: 'Company', children: companyFields() },
    ],
  };
}

function company(): OutputSchema {
  return {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'company', label: 'Company', children: companyFields() },
    ],
  };
}
