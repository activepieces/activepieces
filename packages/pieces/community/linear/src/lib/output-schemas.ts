import { OutputSchema } from '@activepieces/pieces-framework';

const idOnly: OutputSchema['fields'] = [{ key: 'id', label: 'ID' }];

const issueFlatFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Issue ID' },
  { key: 'identifier', label: 'Identifier' },
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'priority', label: 'Priority', format: 'number', description: '0 none, 1 urgent, 2 high, 3 medium, 4 low' },
  { key: 'priority_label', label: 'Priority Label' },
  { key: 'estimate', label: 'Estimate', format: 'number' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'branch_name', label: 'Git Branch Name' },
  { key: 'state_id', label: 'Status ID' },
  { key: 'state_name', label: 'Status' },
  { key: 'state_type', label: 'Status Type' },
  { key: 'team_id', label: 'Team ID' },
  { key: 'team_key', label: 'Team Key' },
  { key: 'team_name', label: 'Team Name' },
  { key: 'assignee_id', label: 'Assignee ID' },
  { key: 'assignee_name', label: 'Assignee Name' },
  { key: 'assignee_email', label: 'Assignee Email', format: 'email' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'creator_name', label: 'Creator Name' },
  { key: 'creator_email', label: 'Creator Email', format: 'email' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'project_milestone_id', label: 'Milestone ID' },
  { key: 'project_milestone_name', label: 'Milestone Name' },
  { key: 'cycle_id', label: 'Cycle ID' },
  { key: 'cycle_number', label: 'Cycle Number', format: 'number' },
  { key: 'cycle_name', label: 'Cycle Name' },
  { key: 'parent_id', label: 'Parent Issue ID' },
  { key: 'parent_identifier', label: 'Parent Identifier' },
  { key: 'parent_title', label: 'Parent Title' },
  { key: 'label_ids', label: 'Label IDs' },
  { key: 'label_names', label: 'Labels' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'started_at', label: 'Started At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'canceled_at', label: 'Canceled At', format: 'datetime' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
  { key: 'trashed', label: 'In Trash', format: 'boolean' },
];

const attachmentFlatFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'title', label: 'Title' },
  { key: 'subtitle', label: 'Subtitle' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'source_type', label: 'Source Type' },
  { key: 'issue_id', label: 'Issue ID' },
  { key: 'issue_identifier', label: 'Issue Identifier' },
  { key: 'issue_title', label: 'Issue Title' },
  { key: 'creator_id', label: 'Creator ID' },
  { key: 'creator_name', label: 'Creator Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const projectStatusUpdateFlatFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Status Update ID' },
  { key: 'body', label: 'Body (Markdown)' },
  { key: 'health', label: 'Health' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'is_diff_hidden', label: 'Diff Hidden', format: 'boolean' },
  { key: 'user_id', label: 'Author ID' },
  { key: 'user_name', label: 'Author Name' },
  { key: 'user_email', label: 'Author Email', format: 'email' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'edited_at', label: 'Edited At', format: 'datetime' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
];

const archivedIssueFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
  { key: 'id', label: 'Issue ID' },
  { key: 'identifier', label: 'Identifier' },
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'trashed', label: 'In Trash', format: 'boolean' },
  { key: 'archived_at', label: 'Archived At', format: 'datetime' },
];

const pageFields = ({ itemsLabel, items, labelKey }: { itemsLabel: string; items: OutputSchema['fields']; labelKey: string }): OutputSchema['fields'] => [
  { key: 'items', label: itemsLabel, labelKey, listItems: items },
  { key: 'count', label: 'Returned Count', format: 'number' },
  { key: 'has_next_page', label: 'Has More', format: 'boolean' },
  { key: 'end_cursor', label: 'Next Page Cursor' },
];

const sdkIssueModelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Issue ID' },
  { key: 'identifier', label: 'Identifier' },
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'priority', label: 'Priority', format: 'number' },
  { key: 'priorityLabel', label: 'Priority Label' },
  { key: 'estimate', label: 'Estimate', format: 'number' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'branchName', label: 'Git Branch Name' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'completedAt', label: 'Completed At', format: 'datetime' },
  { key: 'canceledAt', label: 'Canceled At', format: 'datetime' },
  { key: '_team', label: 'Team', children: idOnly },
  { key: '_state', label: 'Status', children: idOnly },
  { key: '_assignee', label: 'Assignee', children: idOnly },
  { key: '_creator', label: 'Creator', children: idOnly },
  { key: '_project', label: 'Project', children: idOnly },
  { key: '_projectMilestone', label: 'Milestone', children: idOnly },
  { key: '_cycle', label: 'Cycle', children: idOnly },
  { key: '_parent', label: 'Parent Issue', children: idOnly },
];

const legacyProjectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'color', label: 'Color' },
  { key: 'icon', label: 'Icon' },
  { key: 'state', label: 'State' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'targetDate', label: 'Target Date', format: 'date' },
  { key: 'progress', label: 'Progress', format: 'number' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const sdkCommentModelFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'body', label: 'Body (Markdown)' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: '_issue', label: 'Issue', children: idOnly },
  { key: '_user', label: 'Author', children: idOnly },
];

const mutationEnvelope = ({ key, label, children }: { key: string; label: string; children: OutputSchema['fields'] }): OutputSchema => ({
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'lastSyncId', label: 'Last Sync ID', format: 'number' },
    { key, label, children },
  ],
});

const webhookUserFields = ({ prefix }: { prefix: string }): OutputSchema['fields'] => [
  { key: 'id', label: `${prefix} ID` },
  { key: 'name', label: `${prefix} Name` },
  { key: 'email', label: `${prefix} Email`, format: 'email' },
  { key: 'avatarUrl', label: `${prefix} Avatar`, format: 'image' },
  { key: 'url', label: `${prefix} Profile URL`, format: 'url' },
];

const webhookEnvelope = ({ data, extra }: { data: OutputSchema['fields']; extra?: OutputSchema['fields'] }): OutputSchema => ({
  fields: [
    { key: 'action', label: 'Action', description: 'create, update or remove' },
    { key: 'type', label: 'Resource Type' },
    { key: 'url', label: 'URL', format: 'url' },
    { key: 'createdAt', label: 'Event Time', format: 'datetime' },
    {
      key: 'actor',
      label: 'Actor',
      children: [...webhookUserFields({ prefix: 'Actor' }), { key: 'type', label: 'Actor Type' }],
    },
    { key: 'data', label: 'Data', children: data },
    ...(extra ?? []),
    { key: 'organizationId', label: 'Workspace ID' },
    { key: 'webhookId', label: 'Webhook ID' },
    { key: 'webhookTimestamp', label: 'Webhook Timestamp', format: 'number', description: 'Unix time in milliseconds' },
  ],
});

const issueWebhookDataFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Issue ID' },
  { key: 'identifier', label: 'Identifier' },
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description', description: 'Markdown. Missing when the issue has no description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'priority', label: 'Priority', format: 'number', description: '0 none, 1 urgent, 2 high, 3 medium, 4 low' },
  { key: 'priorityLabel', label: 'Priority Label' },
  { key: 'dueDate', label: 'Due Date', format: 'date' },
  { key: 'stateId', label: 'Status ID' },
  {
    key: 'state',
    label: 'Status',
    children: [
      { key: 'id', label: 'Status ID' },
      { key: 'name', label: 'Status Name' },
      { key: 'type', label: 'Status Type' },
      { key: 'color', label: 'Color' },
    ],
  },
  { key: 'teamId', label: 'Team ID' },
  {
    key: 'team',
    label: 'Team',
    children: [
      { key: 'id', label: 'Team ID' },
      { key: 'key', label: 'Team Key' },
      { key: 'name', label: 'Team Name' },
    ],
  },
  { key: 'assigneeId', label: 'Assignee ID', description: 'Missing when the issue is unassigned' },
  { key: 'assignee', label: 'Assignee', children: webhookUserFields({ prefix: 'Assignee' }) },
  { key: 'creatorId', label: 'Creator ID' },
  { key: 'projectId', label: 'Project ID' },
  {
    key: 'project',
    label: 'Project',
    children: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Project Name' },
      { key: 'url', label: 'Project URL', format: 'url' },
    ],
  },
  { key: 'parentId', label: 'Parent Issue ID' },
  { key: 'labelIds', label: 'Label IDs' },
  {
    key: 'labels',
    label: 'Labels',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Label ID' },
      { key: 'name', label: 'Label Name' },
      { key: 'color', label: 'Color' },
    ],
  },
  { key: 'subscriberIds', label: 'Subscriber IDs' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'completedAt', label: 'Completed At', format: 'datetime' },
  { key: 'canceledAt', label: 'Canceled At', format: 'datetime' },
  { key: 'trashed', label: 'In Trash', format: 'boolean', description: 'Set on Removed Issue events' },
];

const projectWebhookDataFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'identifier', label: 'Identifier' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'slugId', label: 'Slug ID' },
  { key: 'color', label: 'Color' },
  { key: 'icon', label: 'Icon' },
  { key: 'priority', label: 'Priority', format: 'number', description: '0 none, 1 urgent, 2 high, 3 medium, 4 low' },
  { key: 'statusId', label: 'Status ID' },
  {
    key: 'status',
    label: 'Status',
    children: [
      { key: 'id', label: 'Status ID' },
      { key: 'name', label: 'Status Name' },
      { key: 'type', label: 'Status Type' },
      { key: 'color', label: 'Color' },
    ],
  },
  { key: 'health', label: 'Health', description: 'onTrack, atRisk or offTrack, from the latest status update' },
  { key: 'teamIds', label: 'Team IDs' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'lead', label: 'Lead', children: webhookUserFields({ prefix: 'Lead' }) },
  { key: 'memberIds', label: 'Member IDs' },
  { key: 'labelIds', label: 'Label IDs' },
  { key: 'creatorId', label: 'Creator ID' },
  { key: 'startDate', label: 'Start Date', format: 'date' },
  { key: 'targetDate', label: 'Target Date', format: 'date' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'trashed', label: 'In Trash', format: 'boolean', description: 'Set on Removed Project events' },
];

const commentWebhookDataFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'body', label: 'Body (Markdown)' },
  { key: 'issueId', label: 'Issue ID' },
  { key: 'parentId', label: 'Parent Comment ID', description: 'Only on replies' },
  { key: 'userId', label: 'Author ID' },
  { key: 'user', label: 'Author', children: webhookUserFields({ prefix: 'Author' }) },
  {
    key: 'issue',
    label: 'Issue',
    children: [
      { key: 'id', label: 'Issue ID' },
      { key: 'identifier', label: 'Identifier' },
      { key: 'title', label: 'Title' },
      { key: 'url', label: 'Issue URL', format: 'url' },
      { key: 'teamId', label: 'Team ID' },
      {
        key: 'team',
        label: 'Team',
        children: [
          { key: 'id', label: 'Team ID' },
          { key: 'key', label: 'Team Key' },
          { key: 'name', label: 'Team Name' },
        ],
      },
    ],
  },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const projectStatusUpdateWebhookDataFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Status Update ID' },
  { key: 'body', label: 'Body (Markdown)' },
  { key: 'health', label: 'Health', description: 'onTrack, atRisk or offTrack' },
  { key: 'diffMarkdown', label: 'Changes Since Last Update', description: 'Markdown summary Linear adds of what changed in the project' },
  { key: 'slugId', label: 'Slug ID' },
  { key: 'projectId', label: 'Project ID' },
  {
    key: 'project',
    label: 'Project',
    children: [
      { key: 'id', label: 'Project ID' },
      { key: 'name', label: 'Project Name' },
      { key: 'url', label: 'Project URL', format: 'url' },
    ],
  },
  { key: 'userId', label: 'Author ID' },
  { key: 'user', label: 'Author', children: webhookUserFields({ prefix: 'Author' }) },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const updatedFromField: OutputSchema['fields'] = [
  {
    key: 'updatedFrom',
    label: 'Previous Values',
    dynamicKey: true,
    description: 'Only the fields that changed, with their value before the update',
  },
];

export const linearFieldSets = {
  idOnly,
  issueFlatFields,
  attachmentFlatFields,
  projectStatusUpdateFlatFields,
  archivedIssueFields,
  pageFields,
};

export const issueMutationOutputSchema: OutputSchema = mutationEnvelope({ key: 'issue', label: 'Issue', children: sdkIssueModelFields });
export const projectMutationOutputSchema: OutputSchema = mutationEnvelope({ key: 'project', label: 'Project', children: legacyProjectFields });
export const commentMutationOutputSchema: OutputSchema = mutationEnvelope({ key: 'comment', label: 'Comment', children: sdkCommentModelFields });

export const issueOutputSchema: OutputSchema = { fields: issueFlatFields };
export const issueSearchOutputSchema: OutputSchema = {
  fields: [
    ...pageFields({ itemsLabel: 'Issues', items: issueFlatFields, labelKey: 'identifier' }),
    { key: 'total_count', label: 'Total Matches', format: 'number' },
  ],
};
export const archivedIssueOutputSchema: OutputSchema = { fields: archivedIssueFields };
export const attachmentOutputSchema: OutputSchema = { fields: attachmentFlatFields };
export const projectStatusUpdateOutputSchema: OutputSchema = { fields: projectStatusUpdateFlatFields };

export const issueWebhookOutputSchema: OutputSchema = webhookEnvelope({ data: issueWebhookDataFields });
export const updatedIssueWebhookOutputSchema: OutputSchema = webhookEnvelope({ data: issueWebhookDataFields, extra: updatedFromField });
export const projectWebhookOutputSchema: OutputSchema = webhookEnvelope({ data: projectWebhookDataFields });
export const updatedProjectWebhookOutputSchema: OutputSchema = webhookEnvelope({ data: projectWebhookDataFields, extra: updatedFromField });
export const commentWebhookOutputSchema: OutputSchema = webhookEnvelope({ data: commentWebhookDataFields });
export const projectStatusUpdateWebhookOutputSchema: OutputSchema = webhookEnvelope({ data: projectStatusUpdateWebhookDataFields });
