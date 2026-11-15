import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

type Fields = OutputSchemaField[];

const pageFields = ({ label, itemFields, labelKey }: { label: string; itemFields: Fields; labelKey: string }): Fields => [
  { key: 'items', label, labelKey, listItems: itemFields },
  { key: 'count', label: 'Items on This Page', format: 'number' },
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'nextPage', label: 'Next Page', format: 'number', description: 'Pass as Page to fetch more. Empty on the last page.' },
  { key: 'hasMore', label: 'Has More', format: 'boolean' },
  { key: 'total', label: 'Total', format: 'number', description: 'Total items when GitLab reports it; empty for very large lists.' },
];

const userRefFields: Fields = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'state', label: 'State' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'web_url', label: 'Profile URL', format: 'url' },
];

const pipelineFields: Fields = [
  { key: 'id', label: 'Pipeline ID', format: 'number' },
  { key: 'iid', label: 'Pipeline IID', format: 'number' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'ref', label: 'Ref' },
  { key: 'sha', label: 'Commit SHA' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

export const pipelineOutputSchema: OutputSchema = {
  fields: [
    ...pipelineFields,
    { key: 'before_sha', label: 'Before SHA' },
    { key: 'tag', label: 'Is Tag', format: 'boolean' },
    { key: 'yaml_errors', label: 'YAML Errors' },
    { key: 'user', label: 'Triggered By', children: userRefFields },
    { key: 'started_at', label: 'Started At', format: 'datetime' },
    { key: 'finished_at', label: 'Finished At', format: 'datetime' },
    { key: 'committed_at', label: 'Committed At', format: 'datetime' },
    { key: 'duration', label: 'Duration (seconds)', format: 'number' },
    { key: 'queued_duration', label: 'Queued (seconds)', format: 'number' },
    { key: 'coverage', label: 'Coverage' },
    { key: 'detailed_status', label: 'Detailed Status', children: [{ key: 'text', label: 'Text' }, { key: 'label', label: 'Label' }, { key: 'group', label: 'Group' }] },
  ],
};
export const pipelineListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Pipelines', itemFields: pipelineFields, labelKey: 'id' }) };
export const deletedPipelineOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'pipelineId', label: 'Pipeline ID', format: 'number' },
  ],
};

const jobFields: Fields = [
  { key: 'id', label: 'Job ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'stage', label: 'Stage' },
  { key: 'status', label: 'Status' },
  { key: 'ref', label: 'Ref' },
  { key: 'tag', label: 'Is Tag', format: 'boolean' },
  { key: 'allow_failure', label: 'Allow Failure', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'started_at', label: 'Started At', format: 'datetime' },
  { key: 'finished_at', label: 'Finished At', format: 'datetime' },
  { key: 'erased_at', label: 'Erased At', format: 'datetime' },
  { key: 'duration', label: 'Duration (seconds)', format: 'number' },
  { key: 'queued_duration', label: 'Queued (seconds)', format: 'number' },
  { key: 'user', label: 'User', children: userRefFields },
  { key: 'commit', label: 'Commit', children: [{ key: 'id', label: 'SHA' }, { key: 'short_id', label: 'Short SHA' }, { key: 'title', label: 'Title' }] },
  { key: 'pipeline', label: 'Pipeline', children: [{ key: 'id', label: 'Pipeline ID', format: 'number' }, { key: 'ref', label: 'Ref' }, { key: 'status', label: 'Status' }] },
  { key: 'web_url', label: 'URL', format: 'url' },
];

export const jobOutputSchema: OutputSchema = { fields: jobFields };
export const jobListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Jobs', itemFields: jobFields, labelKey: 'name' }) };
export const jobLogOutputSchema: OutputSchema = {
  fields: [
    { key: 'jobId', label: 'Job ID', format: 'number' },
    { key: 'log', label: 'Log' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    { key: 'totalLength', label: 'Full Log Length (characters)', format: 'number' },
  ],
};

const namespaceFields: Fields = [
  { key: 'id', label: 'Namespace ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path' },
  { key: 'kind', label: 'Kind' },
  { key: 'full_path', label: 'Full Path' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

const projectFields: Fields = [
  { key: 'id', label: 'Project ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'name_with_namespace', label: 'Name With Namespace' },
  { key: 'path', label: 'Path' },
  { key: 'path_with_namespace', label: 'Full Path' },
  { key: 'description', label: 'Description' },
  { key: 'default_branch', label: 'Default Branch' },
  { key: 'star_count', label: 'Stars', format: 'number' },
  { key: 'forks_count', label: 'Forks', format: 'number' },
  { key: 'topics', label: 'Topics' },
  { key: 'namespace', label: 'Namespace', children: namespaceFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'last_activity_at', label: 'Last Activity', format: 'datetime' },
  { key: 'http_url_to_repo', label: 'HTTP Clone URL', format: 'url' },
  { key: 'ssh_url_to_repo', label: 'SSH Clone URL' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

export const projectOutputSchema: OutputSchema = {
  fields: [
    ...projectFields,
    { key: 'visibility', label: 'Visibility' },
    { key: 'archived', label: 'Archived', format: 'boolean' },
    { key: 'import_status', label: 'Import Status' },
  ],
};
export const projectListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Projects', itemFields: projectFields, labelKey: 'path_with_namespace' }) };
export const deletedProjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'deletionRequested', label: 'Deletion Requested', format: 'boolean' },
    { key: 'projectId', label: 'Project ID or Path' },
    { key: 'message', label: 'GitLab Message' },
  ],
};
export const projectStarOutputSchema: OutputSchema = {
  fields: [
    { key: 'starred', label: 'Starred', format: 'boolean' },
    { key: 'unchanged', label: 'Already In This State', format: 'boolean' },
    { key: 'projectId', label: 'Project ID', format: 'number' },
    { key: 'path_with_namespace', label: 'Full Path' },
    { key: 'star_count', label: 'Stars', format: 'number' },
  ],
};
export const projectLanguagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'languages', label: 'Languages', labelKey: 'language', listItems: [{ key: 'language', label: 'Language' }, { key: 'percentage', label: 'Percentage', format: 'number' }] },
    { key: 'count', label: 'Language Count', format: 'number' },
  ],
};

const groupRefFields: Fields = [
  { key: 'id', label: 'Group ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'full_path', label: 'Full Path' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

const groupFields: Fields = [
  ...groupRefFields,
  { key: 'path', label: 'Path' },
  { key: 'description', label: 'Description' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'parent_id', label: 'Parent Group ID', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const groupOutputSchema: OutputSchema = { fields: groupFields };
export const groupListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Groups', itemFields: groupFields, labelKey: 'full_path' }) };
export const groupRefListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Groups', itemFields: groupRefFields, labelKey: 'full_path' }) };
export const deletedGroupOutputSchema: OutputSchema = {
  fields: [
    { key: 'deletionRequested', label: 'Deletion Requested', format: 'boolean' },
    { key: 'groupId', label: 'Group ID or Path' },
    { key: 'message', label: 'GitLab Message' },
  ],
};
export const projectShareOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Link ID', format: 'number' },
    { key: 'project_id', label: 'Project ID', format: 'number' },
    { key: 'group_id', label: 'Group ID', format: 'number' },
    { key: 'group_access', label: 'Access Level', format: 'number' },
    { key: 'expires_at', label: 'Expires At', format: 'date' },
  ],
};
export const importMembersOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'sourceProjectId', label: 'Source Project ID', format: 'number' },
    { key: 'errors', label: 'Per-User Errors', labelKey: 'user', listItems: [{ key: 'user', label: 'User' }, { key: 'message', label: 'Message' }] },
  ],
};

const memberFields: Fields = [
  ...userRefFields,
  { key: 'access_level', label: 'Access Level', format: 'number' },
  { key: 'expires_at', label: 'Expires At', format: 'date' },
  { key: 'created_at', label: 'Added At', format: 'datetime' },
  { key: 'membership_state', label: 'Membership State' },
];

export const memberOutputSchema: OutputSchema = { fields: memberFields };
export const memberListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Members', itemFields: memberFields, labelKey: 'username' }) };
export const projectUserListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Users', itemFields: userRefFields, labelKey: 'username' }) };
export const billableMemberListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Billable Members',
    itemFields: [...userRefFields, { key: 'last_activity_on', label: 'Last Activity', format: 'date' }, { key: 'membership_type', label: 'Membership Type' }, { key: 'removable', label: 'Removable', format: 'boolean' }],
    labelKey: 'username',
  }),
};
export const pendingMemberListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Pending Members',
    itemFields: [
      { key: 'id', label: 'Member ID', format: 'number' },
      { key: 'username', label: 'Username' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Invited Email', format: 'email' },
      { key: 'invited', label: 'Invited', format: 'boolean' },
      { key: 'approved', label: 'Approved', format: 'boolean' },
      { key: 'web_url', label: 'Profile URL', format: 'url' },
    ],
    labelKey: 'name',
  }),
};

const labelFields: Fields = [
  { key: 'id', label: 'Label ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'text_color', label: 'Text Color' },
  { key: 'description', label: 'Description' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'is_project_label', label: 'Project Label', format: 'boolean' },
  { key: 'subscribed', label: 'Subscribed', format: 'boolean' },
];

export const labelOutputSchema: OutputSchema = { fields: labelFields };
export const labelListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Labels', itemFields: labelFields, labelKey: 'name' }) };
export const deletedLabelOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'label', label: 'Label ID or Name' },
  ],
};

const milestoneFields: Fields = [
  { key: 'id', label: 'Milestone ID', format: 'number' },
  { key: 'iid', label: 'Milestone IID', format: 'number' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'state', label: 'State' },
  { key: 'start_date', label: 'Start Date', format: 'date' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'expired', label: 'Expired', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

export const milestoneOutputSchema: OutputSchema = { fields: milestoneFields };
export const milestoneListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Milestones', itemFields: milestoneFields, labelKey: 'title' }) };
export const deletedMilestoneOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'milestoneId', label: 'Milestone ID', format: 'number' },
  ],
};

const hookFields: Fields = [
  { key: 'id', label: 'Webhook ID', format: 'number' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'push_events', label: 'Push Events', format: 'boolean' },
  { key: 'push_events_branch_filter', label: 'Push Branch Filter' },
  { key: 'issues_events', label: 'Issue Events', format: 'boolean' },
  { key: 'confidential_issues_events', label: 'Confidential Issue Events', format: 'boolean' },
  { key: 'merge_requests_events', label: 'Merge Request Events', format: 'boolean' },
  { key: 'tag_push_events', label: 'Tag Push Events', format: 'boolean' },
  { key: 'note_events', label: 'Comment Events', format: 'boolean' },
  { key: 'job_events', label: 'Job Events', format: 'boolean' },
  { key: 'pipeline_events', label: 'Pipeline Events', format: 'boolean' },
  { key: 'wiki_page_events', label: 'Wiki Page Events', format: 'boolean' },
  { key: 'releases_events', label: 'Release Events', format: 'boolean' },
  { key: 'enable_ssl_verification', label: 'SSL Verification', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const hookOutputSchema: OutputSchema = { fields: hookFields };
export const hookListOutputSchema: OutputSchema = { fields: pageFields({ label: 'Webhooks', itemFields: hookFields, labelKey: 'url' }) };
export const deletedHookOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'hookId', label: 'Webhook ID', format: 'number' },
  ],
};

export const approvalStateOutputSchema: OutputSchema = {
  fields: [
    { key: 'approval_rules_overwritten', label: 'Rules Overridden On This Merge Request', format: 'boolean' },
    {
      key: 'rules',
      label: 'Approval Rules',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Rule ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'rule_type', label: 'Rule Type' },
        { key: 'approvals_required', label: 'Approvals Required', format: 'number' },
        { key: 'approved', label: 'Approved', format: 'boolean' },
        { key: 'approved_by', label: 'Approved By', labelKey: 'username', listItems: userRefFields },
        { key: 'eligible_approvers', label: 'Eligible Approvers', labelKey: 'username', listItems: userRefFields },
      ],
    },
  ],
};
