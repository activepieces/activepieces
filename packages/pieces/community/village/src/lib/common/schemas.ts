import { OutputSchema } from '@activepieces/pieces-framework';

const paginationField: OutputSchema['fields'][number] = {
  key: 'pagination',
  label: 'Pagination',
  children: [
    { key: 'cursor', label: 'Next Cursor' },
    { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

const locationFields: OutputSchema['fields'] = [
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
];

const workFields: OutputSchema['fields'] = [
  { key: 'title', label: 'Title' },
  { key: 'company', label: 'Company' },
  { key: 'start_date', label: 'Start Date' },
  { key: 'end_date', label: 'End Date' },
  { key: 'location', label: 'Location' },
  { key: 'description', label: 'Description' },
];

const personProfileFields: OutputSchema['fields'] = [
  { key: 'full_name', label: 'Full Name' },
  { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'headline', label: 'Headline' },
  { key: 'location', label: 'Location', children: locationFields },
  { key: 'work_relevant', label: 'Current Role', children: workFields },
  { key: 'work_history', label: 'Work History', labelKey: 'title', listItems: workFields },
  {
    key: 'education_history',
    label: 'Education',
    labelKey: 'institute',
    listItems: [
      { key: 'institute', label: 'Institute' },
      { key: 'degree', label: 'Degree' },
      { key: 'field_of_study', label: 'Field of Study' },
      { key: 'start_date', label: 'Start Date' },
      { key: 'end_date', label: 'End Date' },
    ],
  },
  { key: 'last_enrichment_at', label: 'Last Enriched At', format: 'datetime' },
];

const companyProfileFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'domain', label: 'Domain' },
  { key: 'website', label: 'Website', format: 'url' },
  { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
  { key: 'employee_count', label: 'Employee Count', format: 'number' },
  { key: 'industry', label: 'Industry' },
  { key: 'founded', label: 'Founded', format: 'number' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'crunchbase_url', label: 'Crunchbase URL', format: 'url' },
  {
    key: 'funding',
    label: 'Funding',
    children: [
      { key: 'last_round_stage', label: 'Last Round Stage' },
      { key: 'last_round_date', label: 'Last Round Date' },
      { key: 'number_of_rounds', label: 'Number of Rounds' },
      { key: 'price', label: 'Price' },
      { key: 'investors', label: 'Investors' },
    ],
  },
  { key: 'last_enrichment_at', label: 'Last Enriched At', format: 'datetime' },
];

const scoreSummaryFields: OutputSchema['fields'] = [
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'score_label', label: 'Score Label' },
  { key: 'description', label: 'Description' },
];

const pathFields: OutputSchema['fields'] = [
  { key: 'degree', label: 'Degree', format: 'number' },
  { key: 'summary', label: 'Summary' },
  { key: 'introducer', label: 'Introducer' },
];

const companyPathCheckFields: OutputSchema['fields'] = [
  { key: 'has_paths', label: 'Has Paths', format: 'boolean' },
  { key: 'score', label: 'Score', format: 'number' },
  { key: 'score_label', label: 'Score Label' },
  { key: 'count', label: 'Path Count', format: 'number' },
  { key: 'avatars', label: 'Avatars' },
  {
    key: 'people',
    label: 'People',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'initials', label: 'Initials' },
      { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
      { key: 'avatar_url', label: 'Avatar', format: 'image' },
    ],
  },
];

const listFields: OutputSchema['fields'] = [
  { key: 'id', label: 'List ID' },
  { key: 'title', label: 'Title' },
  { key: 'type', label: 'Type' },
  { key: 'description', label: 'Description' },
  { key: 'item_count', label: 'Item Count', format: 'number' },
  { key: 'is_public', label: 'Is Public', format: 'boolean' },
  { key: 'public_id', label: 'Public ID' },
  { key: 'notifications_enabled', label: 'Notifications Enabled', format: 'boolean' },
  { key: 'results_diff_since_last_run', label: 'New Results Since Last Run', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const teamOrGroupFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'logo', label: 'Logo', format: 'image' },
  { key: 'invite_link', label: 'Invite Link', format: 'url' },
  { key: 'is_admin', label: 'Is Admin', format: 'boolean' },
];

const successFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'message', label: 'Message' },
];

const webhookFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Webhook ID' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'description', label: 'Description' },
  { key: 'is_active', label: 'Is Active', format: 'boolean' },
  { key: 'event_filter', label: 'Event Filter' },
  { key: 'has_secret', label: 'Has Secret', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const sequenceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sequence ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'outreach_approach', label: 'Outreach Approach' },
  { key: 'total_leads', label: 'Total Leads', format: 'number' },
  { key: 'active_leads', label: 'Active Leads', format: 'number' },
  { key: 'sent_count', label: 'Sent', format: 'number' },
  { key: 'scheduled_count', label: 'Scheduled', format: 'number' },
  { key: 'opened_count', label: 'Opened', format: 'number' },
  { key: 'replied_count', label: 'Replied', format: 'number' },
  { key: 'open_rate', label: 'Open Rate', format: 'number' },
  { key: 'reply_rate', label: 'Reply Rate', format: 'number' },
  { key: 'click_rate', label: 'Click Rate', format: 'number' },
  { key: 'forward_rate', label: 'Forward Rate', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const sequenceDetailFields: OutputSchema['fields'] = [
  { key: 'ai_instructions', label: 'AI Instructions' },
  {
    key: 'ai_email_templates',
    label: 'Email Templates',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Template ID', format: 'number' },
      { key: 'name', label: 'Name' },
      { key: 'use_case', label: 'Use Case' },
      { key: 'used_for', label: 'Used For' },
      { key: 'audience', label: 'Audience' },
      { key: 'subject', label: 'Subject' },
      { key: 'email_body', label: 'Email Body', format: 'html' },
    ],
  },
  { key: 'leads_last_visited', label: 'Leads Last Visited', format: 'datetime' },
];

const flatPageFields: OutputSchema['fields'] = [
  { key: 'found', label: 'Found', format: 'boolean' },
  { key: 'next_cursor', label: 'Next Cursor' },
  { key: 'has_more', label: 'Has More', format: 'boolean' },
];

const getAppInfo: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'App',
      children: [
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'domain_name', label: 'Domain' },
        { key: 'logo', label: 'Logo', format: 'image' },
        { key: 'is_active', label: 'Is Active', format: 'boolean' },
        { key: 'payer', label: 'Payer' },
        { key: 'mode', label: 'Mode' },
        { key: 'trusted', label: 'Trusted', format: 'boolean' },
        { key: 'team_id', label: 'Team ID' },
        { key: 'public_key', label: 'Public Key' },
        { key: 'has_users', label: 'Has Users', format: 'boolean' },
        {
          key: 'capabilities',
          label: 'Capabilities',
          children: [
            { key: 'is_live', label: 'Is Live', format: 'boolean' },
            { key: 'has_server_access', label: 'Has Server Access', format: 'boolean' },
            { key: 'needs_card', label: 'Needs Card', format: 'boolean' },
          ],
        },
      ],
    },
  ],
};

const getCurrentUser: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'User',
      children: [
        { key: 'id', label: 'User ID' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'name', label: 'Name' },
        { key: 'is_sync_complete', label: 'Sync Complete', format: 'boolean' },
        { key: 'is_active', label: 'Is Active', format: 'boolean' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
  ],
};

const getUserStatus: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Status',
      children: [
        { key: 'status', label: 'Status' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'network_updated_at', label: 'Network Updated At', format: 'datetime' },
        {
          key: 'integrations',
          label: 'Integrations',
          labelKey: 'account',
          listItems: [
            { key: 'id', label: 'ID' },
            { key: 'type', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'account', label: 'Account' },
            { key: 'last_synced_at', label: 'Last Synced At', format: 'datetime' },
          ],
        },
      ],
    },
  ],
};

const importRelationships: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Import',
      children: [
        {
          key: 'summary',
          label: 'Summary',
          children: [
            { key: 'processed', label: 'Processed', format: 'number' },
            { key: 'created', label: 'Created', format: 'number' },
            { key: 'updated', label: 'Updated', format: 'number' },
            { key: 'failed', label: 'Failed', format: 'number' },
          ],
        },
        {
          key: 'results',
          label: 'Results',
          labelKey: 'identifier',
          listItems: [
            { key: 'identifier', label: 'Identifier' },
            { key: 'status', label: 'Status' },
            { key: 'error', label: 'Error' },
          ],
        },
      ],
    },
  ],
};

const importRelationshipsFromList: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Import Job',
      children: [
        { key: 'status', label: 'Status' },
        { key: 'list_id', label: 'List ID' },
        { key: 'job_id', label: 'Job ID' },
        { key: 'snapshot_at', label: 'Snapshot At', format: 'datetime' },
      ],
    },
  ],
};

const listWorkOverlaps: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Overlaps',
      labelKey: 'full_name',
      listItems: [
        { key: 'full_name', label: 'Full Name' },
        { key: 'linkedin_identifier', label: 'LinkedIn Identifier' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'headline', label: 'Headline' },
        { key: 'total_overlap_months', label: 'Total Overlap Months', format: 'number' },
        { key: 'work_score', label: 'Work Score', format: 'number' },
        { key: 'route_count', label: 'Route Count', format: 'number' },
        {
          key: 'companies',
          label: 'Companies',
          labelKey: 'company_name',
          listItems: [
            { key: 'company_name', label: 'Company' },
            { key: 'start_date', label: 'Start Date' },
            { key: 'end_date', label: 'End Date' },
            { key: 'overlap_months', label: 'Overlap Months', format: 'number' },
            { key: 'worked_together', label: 'Worked Together', format: 'boolean' },
          ],
        },
      ],
    },
    paginationField,
  ],
};

const getWorkOverlapStats: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Stats',
      children: [
        { key: 'your_overlaps', label: 'Your Overlaps', format: 'number' },
        { key: 'network_overlaps', label: 'Network Overlaps', format: 'number' },
        { key: 'network_capped', label: 'Network Capped', format: 'boolean' },
      ],
    },
  ],
};

const checkCompanyPaths: OutputSchema = {
  fields: [{ key: 'data', label: 'Paths Check', children: companyPathCheckFields }],
};

const checkCompanyPathsBulk: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Results',
      listItems: [...companyPathCheckFields, { key: 'input', label: 'Input' }],
    },
  ],
};

const enrichCompany: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [{ key: 'company', label: 'Company', children: companyProfileFields }],
    },
  ],
};

const enrichCompanyBulk: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Results',
      listItems: [
        { key: 'company', label: 'Company', children: companyProfileFields },
        {
          key: 'error',
          label: 'Error',
          children: [
            { key: 'code', label: 'Code' },
            { key: 'message', label: 'Message' },
          ],
        },
      ],
    },
  ],
};

const getCompanyPaths: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Paths',
      children: [
        {
          key: 'company',
          label: 'Company',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'domain', label: 'Domain' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
            { key: 'village_url', label: 'Village URL', format: 'url' },
          ],
        },
        { key: 'summary', label: 'Summary', children: scoreSummaryFields },
        {
          key: 'target_people',
          label: 'Target People',
          listItems: [
            { key: 'target', label: 'Target' },
            { key: 'degree', label: 'Degree', format: 'number' },
            { key: 'count', label: 'Path Count', format: 'number' },
            { key: 'paths_hidden', label: 'Paths Hidden', format: 'number' },
            { key: 'summary', label: 'Summary' },
          ],
        },
        paginationField,
      ],
    },
    paginationField,
  ],
};

const listCompanies: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Companies',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'domain_name', label: 'Domain' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'image_url', label: 'Logo', format: 'image' },
        { key: 'industry', label: 'Industry' },
        { key: 'employee_count', label: 'Employee Count', format: 'number' },
        { key: 'headquarters', label: 'Headquarters' },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'score_label', label: 'Score Label' },
      ],
    },
    paginationField,
  ],
};

const searchCompanies: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Companies',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Company ID' },
        { key: 'name', label: 'Name' },
        { key: 'domain', label: 'Domain' },
        { key: 'website', label: 'Website', format: 'url' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'industry', label: 'Industry' },
        { key: 'employee_count', label: 'Employee Count', format: 'number' },
        { key: 'location', label: 'Location' },
        { key: 'description', label: 'Description' },
        { key: 'warmth_score', label: 'Warmth Score', format: 'number' },
        { key: 'warmth_label', label: 'Warmth Label' },
      ],
    },
    paginationField,
  ],
};

const sortCompanies: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Sorted Companies',
      labelKey: 'domain_name',
      listItems: [
        { key: 'url', label: 'Input URL' },
        { key: 'domain_name', label: 'Domain' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'score_label', label: 'Score Label' },
      ],
    },
  ],
};

const listGroups: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [{ key: 'groups', label: 'Groups', labelKey: 'name', listItems: teamOrGroupFields }],
    },
  ],
};

const listTeams: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [{ key: 'teams', label: 'Teams', labelKey: 'name', listItems: teamOrGroupFields }],
    },
  ],
};

const upsertTeamOrGroup: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: teamOrGroupFields.filter((field) => field.key !== 'is_admin'),
    },
  ],
};

const successResult: OutputSchema = {
  fields: [{ key: 'data', label: 'Result', children: successFields }],
};

const joinTeam: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [...successFields, { key: 'status', label: 'Status' }],
    },
  ],
};

const leaveTeam: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        ...successFields,
        { key: 'warnings', label: 'Warnings' },
        { key: 'selected_team_id', label: 'Selected Team ID' },
      ],
    },
  ],
};

const discoverTeamsByDomain: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        {
          key: 'teams',
          label: 'Teams',
          labelKey: 'name',
          listItems: [
            { key: 'id', label: 'Team ID' },
            { key: 'name', label: 'Name' },
            { key: 'domain', label: 'Domain' },
            { key: 'logo', label: 'Logo', format: 'image' },
            { key: 'member_count', label: 'Member Count', format: 'number' },
            { key: 'direct_warm', label: 'Direct Warm', format: 'number' },
            { key: 'network_warm', label: 'Network Warm', format: 'number' },
            { key: 'is_paid', label: 'Is Paid', format: 'boolean' },
          ],
        },
      ],
    },
  ],
};

const singleList: OutputSchema = {
  fields: [{ key: 'data', label: 'List', children: listFields }],
};

const listLists: OutputSchema = {
  fields: [{ key: 'data', label: 'Lists', labelKey: 'title', listItems: listFields }, paginationField],
};

const getList: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'List',
      children: [
        ...listFields,
        {
          key: 'items',
          label: 'Items',
          listItems: [
            { key: 'id', label: 'Item ID' },
            { key: 'graph_id', label: 'Graph ID' },
            { key: 'type', label: 'Type' },
            { key: 'data', label: 'Data' },
            { key: 'screening', label: 'Screening' },
            { key: 'created_at', label: 'Added At', format: 'datetime' },
          ],
        },
      ],
    },
    paginationField,
  ],
};

const addListItems: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        {
          key: 'summary',
          label: 'Summary',
          children: [
            { key: 'total', label: 'Total', format: 'number' },
            { key: 'added', label: 'Added', format: 'number' },
            { key: 'failed', label: 'Failed', format: 'number' },
          ],
        },
        {
          key: 'results',
          label: 'Results',
          labelKey: 'identifier',
          listItems: [
            { key: 'identifier', label: 'Identifier' },
            { key: 'item', label: 'Item' },
            { key: 'error', label: 'Error' },
          ],
        },
      ],
    },
  ],
};

const removeListItems: OutputSchema = {
  fields: [
    { key: 'data', label: 'Result', children: [{ key: 'removed', label: 'Removed', format: 'number' }] },
  ],
};

const checkListMembership: OutputSchema = {
  fields: [{ key: 'data', label: 'Membership', dynamicKey: true }],
};

const messageResult: OutputSchema = {
  fields: [{ key: 'data', label: 'Result', children: [{ key: 'message', label: 'Message' }] }],
};

const refreshList: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [{ key: 'is_processing', label: 'Is Processing', format: 'boolean' }],
    },
  ],
};

const enrichPerson: OutputSchema = {
  fields: [{ key: 'data', label: 'Person', children: personProfileFields }],
};

const enrichPersonBulk: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'People',
      labelKey: 'full_name',
      listItems: [
        ...personProfileFields,
        { key: 'id', label: 'Input ID' },
        { key: 'found', label: 'Found', format: 'boolean' },
        { key: 'error', label: 'Error' },
      ],
    },
  ],
};

const enrichPersonEmail: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'emails', label: 'All Emails' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
      ],
    },
  ],
};

const enrichPersonEmailBulk: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Results',
      labelKey: 'linkedin_url',
      listItems: [
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'error', label: 'Error' },
      ],
    },
  ],
};

const getPersonPaths: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Paths',
      children: [
        {
          key: 'person',
          label: 'Person',
          children: [
            { key: 'full_name', label: 'Full Name' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
            { key: 'avatar', label: 'Avatar', format: 'image' },
            { key: 'village_url', label: 'Village URL', format: 'url' },
          ],
        },
        { key: 'summary', label: 'Summary', children: scoreSummaryFields },
        { key: 'paths', label: 'Paths', listItems: pathFields },
        { key: 'count', label: 'Path Count', format: 'number' },
        { key: 'paths_hidden', label: 'Paths Hidden', format: 'number' },
      ],
    },
  ],
};

const getPersonPathsBulk: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Results',
      listItems: [
        {
          key: 'target',
          label: 'Target',
          children: [
            { key: 'full_name', label: 'Full Name' },
            { key: 'linkedin_identifier', label: 'LinkedIn Identifier' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
            { key: 'title', label: 'Title' },
          ],
        },
        { key: 'summary', label: 'Summary', children: scoreSummaryFields },
        { key: 'paths', label: 'Paths', listItems: pathFields },
        { key: 'count', label: 'Path Count', format: 'number' },
        { key: 'paths_hidden', label: 'Paths Hidden', format: 'number' },
      ],
    },
  ],
};

const getPersonPosts: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Posts',
      listItems: [
        { key: 'id', label: 'Post ID' },
        { key: 'linkedin_url', label: 'Post URL', format: 'url' },
        { key: 'content', label: 'Content' },
        { key: 'posted_at', label: 'Posted At', format: 'datetime' },
        {
          key: 'author',
          label: 'Author',
          children: [
            { key: 'name', label: 'Name' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
            { key: 'headline', label: 'Headline' },
          ],
        },
        { key: 'reposted_by', label: 'Reposted By' },
        {
          key: 'engagement',
          label: 'Engagement',
          children: [
            { key: 'likes', label: 'Likes', format: 'number' },
            { key: 'comments', label: 'Comments', format: 'number' },
            { key: 'shares', label: 'Shares', format: 'number' },
          ],
        },
        { key: 'has_video', label: 'Has Video', format: 'boolean' },
        {
          key: 'mentions',
          label: 'Mentions',
          labelKey: 'name',
          listItems: [
            { key: 'name', label: 'Name' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
          ],
        },
        {
          key: 'article',
          label: 'Article',
          children: [
            { key: 'title', label: 'Title' },
            { key: 'link', label: 'Link', format: 'url' },
          ],
        },
        { key: 'document', label: 'Document', children: [{ key: 'title', label: 'Title' }] },
        { key: 'images', label: 'Images' },
        {
          key: 'repost',
          label: 'Repost',
          children: [
            { key: 'content', label: 'Content' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
          ],
        },
      ],
    },
    paginationField,
  ],
};

const listPeople: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'People',
      labelKey: 'full_name',
      listItems: [
        { key: 'linkedin_identifier', label: 'LinkedIn Identifier' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'avatar', label: 'Avatar', format: 'image' },
        { key: 'headline', label: 'Headline' },
        { key: 'location', label: 'Location' },
        { key: 'work_relevant', label: 'Current Role', children: workFields },
        { key: 'score', label: 'Score', format: 'number' },
        { key: 'score_label', label: 'Score Label' },
      ],
    },
    {
      ...paginationField,
      children: [...(paginationField.children ?? []), { key: 'limit', label: 'Limit', format: 'number' }],
    },
  ],
};

const searchPeople: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'People',
      labelKey: 'full_name',
      listItems: [
        { key: 'id', label: 'Person ID', format: 'number' },
        { key: 'full_name', label: 'Full Name' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'headline', label: 'Headline' },
        { key: 'location', label: 'Location', children: locationFields },
        { key: 'work_relevant', label: 'Current Role', children: workFields },
        { key: 'image_url', label: 'Photo', format: 'image' },
      ],
    },
    paginationField,
  ],
};

const sortPeople: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        {
          key: 'sorted',
          label: 'Sorted',
          labelKey: 'linkedin_url',
          listItems: [
            { key: 'url', label: 'Input URL' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
            { key: 'score', label: 'Score', format: 'number' },
            { key: 'score_label', label: 'Score Label' },
          ],
        },
        {
          key: 'errors',
          label: 'Errors',
          listItems: [
            { key: 'url', label: 'URL' },
            { key: 'error', label: 'Error' },
          ],
        },
      ],
    },
  ],
};

const singleWebhook: OutputSchema = {
  fields: [{ key: 'data', label: 'Webhook', children: webhookFields }],
};

const createWebhook: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Webhook',
      children: [...webhookFields, { key: 'secret', label: 'Signing Secret' }],
    },
  ],
};

const listWebhooks: OutputSchema = {
  fields: [{ key: 'data', label: 'Webhooks', labelKey: 'url', listItems: webhookFields }, paginationField],
};

const listSequences: OutputSchema = {
  fields: [{ key: 'data', label: 'Sequences', labelKey: 'name', listItems: [...sequenceFields, ...sequenceDetailFields] }, paginationField],
};

const getSequence: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Sequence',
      children: [
        { key: 'id', label: 'Sequence ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'status', label: 'Status' },
        { key: 'outreach_approach', label: 'Outreach Approach' },
        ...sequenceDetailFields,
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      ],
    },
  ],
};

const createSequence: OutputSchema = {
  fields: [{ key: 'data', label: 'Sequence', children: [{ key: 'id', label: 'Sequence ID' }] }],
};

const listSequenceLeads: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Leads',
      listItems: [
        { key: 'id', label: 'Lead ID' },
        { key: 'sequence_id', label: 'Sequence ID' },
        { key: 'village_person_id', label: 'Person ID', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'replied', label: 'Replied', format: 'boolean' },
        { key: 'has_next_step', label: 'Has Next Step', format: 'boolean' },
        { key: 'pipeline_stage', label: 'Pipeline Stage', format: 'number' },
        { key: 'next_followup_at', label: 'Next Follow-up At', format: 'datetime' },
        { key: 'latest_update_date', label: 'Latest Update At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        {
          key: 'selected_introducers',
          label: 'Selected Introducers',
          listItems: [
            { key: 'rank', label: 'Rank', format: 'number' },
            { key: 'is_direct', label: 'Is Direct', format: 'boolean' },
            { key: 'village_person_id', label: 'Person ID', format: 'number' },
          ],
        },
        {
          key: 'person',
          label: 'Person',
          children: [
            { key: 'id', label: 'Person ID', format: 'number' },
            { key: 'full_name', label: 'Full Name' },
            { key: 'first_name', label: 'First Name' },
            { key: 'last_name', label: 'Last Name' },
            { key: 'linkedin_identifier', label: 'LinkedIn Identifier' },
            { key: 'image_url', label: 'Photo', format: 'image' },
            {
              key: 'position',
              label: 'Position',
              children: [
                { key: 'title', label: 'Title' },
                { key: 'company', label: 'Company', children: [{ key: 'name', label: 'Name' }, { key: 'domain', label: 'Domain' }] },
              ],
            },
            { key: 'email', label: 'Email', format: 'email' },
            { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
            { key: 'headline', label: 'Headline' },
          ],
        },
      ],
    },
    paginationField,
  ],
};

const addSequenceLeads: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        {
          key: 'added_leads',
          label: 'Added Leads',
          listItems: [
            { key: 'id', label: 'Lead ID' },
            { key: 'village_person_id', label: 'Person ID', format: 'number' },
            { key: 'status', label: 'Status' },
          ],
        },
        {
          key: 'skipped_leads',
          label: 'Skipped Leads',
          listItems: [
            { key: 'village_person_id', label: 'Person ID', format: 'number' },
            { key: 'reason', label: 'Reason' },
          ],
        },
      ],
    },
  ],
};

const listSequenceEmails: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        {
          key: 'emails',
          label: 'Emails',
          labelKey: 'subject',
          listItems: [
            { key: 'id', label: 'Email ID' },
            { key: 'sequence_lead_id', label: 'Lead ID' },
            { key: 'subject', label: 'Subject' },
            { key: 'from', label: 'From' },
            { key: 'to_email', label: 'To', format: 'email' },
            { key: 'status', label: 'Status' },
            { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
            { key: 'sent_at', label: 'Sent At', format: 'datetime' },
          ],
        },
        { key: 'credits_low', label: 'Credits Low', format: 'boolean' },
      ],
    },
  ],
};

const listEmailActivities: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        {
          key: 'activities',
          label: 'Activities',
          listItems: [
            { key: 'id', label: 'Activity ID' },
            { key: 'activity_type', label: 'Type' },
            { key: 'decision', label: 'Decision' },
            { key: 'ai_confidence_score', label: 'AI Confidence', format: 'number' },
            { key: 'note', label: 'Note' },
            { key: 'created_at', label: 'Created At', format: 'datetime' },
          ],
        },
      ],
    },
  ],
};

const creditFields: OutputSchema['fields'] = [
  { key: 'credits_used', label: 'Credits Used', format: 'number' },
  { key: 'credits_left', label: 'Credits Left', format: 'number' },
];

const aiFindPeople: OutputSchema = {
  fields: [
    {
      key: 'people',
      label: 'People',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Person ID' },
        { key: 'name', label: 'Name' },
        { key: 'headline', label: 'Headline' },
        { key: 'title', label: 'Title' },
        { key: 'company', label: 'Company' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
      ],
    },
    ...flatPageFields,
    ...creditFields,
  ],
};

const aiFindCompanies: OutputSchema = {
  fields: [
    {
      key: 'companies',
      label: 'Companies',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Company ID' },
        { key: 'name', label: 'Name' },
        { key: 'domain', label: 'Domain' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'industry', label: 'Industry' },
      ],
    },
    ...flatPageFields,
    ...creditFields,
  ],
};

const aiNetworkPeople: OutputSchema = {
  fields: [
    {
      key: 'people',
      label: 'People',
      labelKey: 'name',
      listItems: [
        { key: 'linkedin_identifier', label: 'LinkedIn Identifier' },
        { key: 'name', label: 'Name' },
        { key: 'headline', label: 'Headline' },
        { key: 'title', label: 'Title' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'score_label', label: 'Connection Strength' },
      ],
    },
    ...flatPageFields,
  ],
};

const aiNetworkCompanies: OutputSchema = {
  fields: [
    {
      key: 'companies',
      label: 'Companies',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'domain', label: 'Domain' },
        { key: 'linkedin_url', label: 'LinkedIn URL', format: 'url' },
        { key: 'industry', label: 'Industry' },
        { key: 'score_label', label: 'Connection Strength' },
      ],
    },
    ...flatPageFields,
  ],
};

const aiAddPersonToList: OutputSchema = {
  fields: [
    { key: 'added', label: 'Added', format: 'boolean' },
    { key: 'list_id', label: 'List ID' },
    { key: 'identifier', label: 'Identifier' },
    { key: 'item_id', label: 'Item ID' },
    { key: 'error', label: 'Error' },
  ],
};

const aiAddRelationship: OutputSchema = {
  fields: [
    { key: 'identifier', label: 'Identifier' },
    { key: 'status', label: 'Status' },
    { key: 'error', label: 'Error' },
  ],
};

const aiAddLeadToSequence: OutputSchema = {
  fields: [
    { key: 'added', label: 'Added', format: 'boolean' },
    { key: 'sequence_id', label: 'Sequence ID' },
    { key: 'lead_id', label: 'Lead ID' },
    { key: 'status', label: 'Status' },
    { key: 'skipped_reason', label: 'Skipped Reason' },
  ],
};

const aiResolveByName: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    {
      key: 'other_matches',
      label: 'Other Matches',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

const archiveSequence: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'Sequence ID' },
  ],
};

const deleteSequenceLead: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'lead_id', label: 'Lead ID' },
  ],
};

const refreshJobs: OutputSchema = {
  fields: [{ key: 'data', label: 'Result', children: [{ key: 'job_ids', label: 'Job IDs' }] }],
};

const listIntegrations: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Result',
      children: [
        { key: 'integrations', label: 'Integrations' },
        { key: 'default_integration', label: 'Default Integration' },
        { key: 'can_sync_google', label: 'Can Sync Google', format: 'boolean' },
      ],
    },
  ],
};

const integrationResult: OutputSchema = {
  fields: [{ key: 'data', label: 'Integration' }],
};

const newVillageEvent: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event Type' },
    { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
    { key: 'user_id', label: 'User ID', format: 'number' },
    { key: 'webhook_id', label: 'Webhook ID', format: 'number' },
    { key: 'list_id', label: 'List ID', value: 'data.list_id', format: 'number' },
    { key: 'list_title', label: 'List Title', value: 'data.list_title' },
    { key: 'list_type', label: 'List Type', value: 'data.list_type' },
    { key: 'list_url', label: 'List URL', value: 'data.list_url', format: 'url' },
    { key: 'source', label: 'List Source', value: 'data.source' },
    { key: 'search_query', label: 'Search Query', value: 'data.search_query' },
    { key: 'item_count', label: 'Item Count', value: 'data.item_count', format: 'number' },
    { key: 'data', label: 'Event Data' },
  ],
};

export const villageSchemas = {
  getAppInfo,
  getCurrentUser,
  getUserStatus,
  importRelationships,
  importRelationshipsFromList,
  listWorkOverlaps,
  getWorkOverlapStats,
  checkCompanyPaths,
  checkCompanyPathsBulk,
  enrichCompany,
  enrichCompanyBulk,
  getCompanyPaths,
  listCompanies,
  searchCompanies,
  sortCompanies,
  listGroups,
  listTeams,
  upsertTeamOrGroup,
  successResult,
  joinTeam,
  leaveTeam,
  discoverTeamsByDomain,
  singleList,
  listLists,
  getList,
  addListItems,
  removeListItems,
  checkListMembership,
  messageResult,
  refreshList,
  enrichPerson,
  enrichPersonBulk,
  enrichPersonEmail,
  enrichPersonEmailBulk,
  getPersonPaths,
  getPersonPathsBulk,
  getPersonPosts,
  listPeople,
  searchPeople,
  sortPeople,
  singleWebhook,
  createWebhook,
  listWebhooks,
  listSequences,
  getSequence,
  createSequence,
  listSequenceLeads,
  addSequenceLeads,
  listSequenceEmails,
  listEmailActivities,
  aiFindPeople,
  aiFindCompanies,
  aiNetworkPeople,
  aiNetworkCompanies,
  aiAddPersonToList,
  aiAddRelationship,
  aiAddLeadToSequence,
  aiResolveByName,
  archiveSequence,
  deleteSequenceLead,
  refreshJobs,
  listIntegrations,
  integrationResult,
  newVillageEvent,
};
