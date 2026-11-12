import { OutputSchema } from '@activepieces/pieces-framework';

const issueFields: OutputSchema['fields'] = [
  { key: 'idReadable', label: 'Issue ID' },
  { key: 'summary', label: 'Summary' },
  { key: 'description', label: 'Description' },
  { key: 'id', label: 'Internal ID' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'project_name', label: 'Project Name' },
  { key: 'project_shortName', label: 'Project Short Name' },
  { key: 'reporter_id', label: 'Reporter ID' },
  { key: 'reporter_name', label: 'Reporter Name' },
  { key: 'reporter_login', label: 'Reporter Login' },
  {
    key: 'customFields',
    label: 'Custom Fields',
    description:
      'Custom field values keyed by field name (Priority, State, Assignee, Estimation, ...). The available keys depend on the project.',
    dynamicKey: true,
  },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  { key: 'resolved', label: 'Resolved', format: 'datetime' },
  { key: 'commentsCount', label: 'Comments Count', format: 'number' },
  { key: 'votes', label: 'Votes', format: 'number' },
  { key: 'tags', label: 'Tags', description: 'Tag names as one comma-separated string, or null when the issue has no tags.' },
];

const userRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'login', label: 'Login' },
  { key: 'fullName', label: 'Full Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'banned', label: 'Banned', format: 'boolean' },
  { key: 'guest', label: 'Guest', format: 'boolean' },
];

const projectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Project ID' },
  { key: 'name', label: 'Name' },
  { key: 'shortName', label: 'Short Name' },
  { key: 'description', label: 'Description' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'leader_login', label: 'Leader Login' },
  { key: 'leader_name', label: 'Leader Name' },
];

const sprintFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Sprint ID' },
  { key: 'name', label: 'Name' },
  { key: 'goal', label: 'Goal' },
  { key: 'start', label: 'Start', format: 'datetime' },
  { key: 'finish', label: 'Finish', format: 'datetime' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'isDefault', label: 'Default Sprint', format: 'boolean' },
  { key: 'unresolvedIssuesCount', label: 'Unresolved Issues', format: 'number' },
];

const workItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Work Item ID' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'duration_minutes', label: 'Duration (minutes)', format: 'number' },
  { key: 'duration_presentation', label: 'Duration' },
  { key: 'text', label: 'Description' },
  { key: 'type_id', label: 'Work Type ID' },
  { key: 'type_name', label: 'Work Type' },
  { key: 'author_login', label: 'Author Login' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'creator_login', label: 'Creator Login' },
  { key: 'issue_id', label: 'Issue Internal ID' },
  { key: 'issue_idReadable', label: 'Issue ID' },
  { key: 'issue_summary', label: 'Issue Summary' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
];

const articleFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Article Internal ID' },
  { key: 'idReadable', label: 'Article ID' },
  { key: 'summary', label: 'Title' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'project_shortName', label: 'Project Short Name' },
  { key: 'parent_id', label: 'Parent Internal ID' },
  { key: 'parent_idReadable', label: 'Parent Article ID' },
  { key: 'reporter_login', label: 'Reporter Login' },
  { key: 'reporter_name', label: 'Reporter Name' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
  { key: 'hasChildren', label: 'Has Sub-articles', format: 'boolean' },
];

const articleDetailFields: OutputSchema['fields'] = [
  ...articleFields,
  { key: 'content', label: 'Content' },
  {
    key: 'child_articles',
    label: 'Sub-articles',
    labelKey: 'summary',
    listItems: [
      { key: 'id', label: 'Internal ID' },
      { key: 'idReadable', label: 'Article ID' },
      { key: 'summary', label: 'Title' },
    ],
  },
  { key: 'tags', label: 'Tags', description: 'List of tag names (an array of strings).' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'text', label: 'Text' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'author_login', label: 'Author Login' },
  { key: 'created', label: 'Created', format: 'datetime' },
];

const commentListFields: OutputSchema['fields'] = [
  ...commentFields,
  { key: 'updated', label: 'Updated', format: 'datetime' },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'File Name' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'size_bytes', label: 'Size', format: 'filesize' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'author_login', label: 'Author Login' },
  { key: 'created', label: 'Created', format: 'datetime' },
];

const uploadedAttachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'File Name' },
];

const tagBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tag ID' },
  { key: 'name', label: 'Name' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'owner_name', label: 'Owner Name' },
];

const activityFields: OutputSchema['fields'] = [
  { key: 'type', label: 'Activity Type' },
  { key: 'timestamp', label: 'Timestamp', format: 'datetime' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'author_login', label: 'Author Login' },
  { key: 'field_name', label: 'Changed Field' },
  { key: 'target_id', label: 'Target ID' },
  { key: 'added_values', label: 'Added Values' },
  { key: 'removed_values', label: 'Removed Values' },
  { key: 'comment_text', label: 'Comment Text' },
];

export const createIssueActionOutputSchema: OutputSchema = { fields: issueFields };
export const getIssueActionOutputSchema: OutputSchema = { fields: issueFields };
export const updateIssueActionOutputSchema: OutputSchema = { fields: issueFields };

export const searchIssuesActionOutputSchema: OutputSchema = {
  itemLabel: '{idReadable}: {summary}',
  fields: [
    { key: 'issues', label: 'Issues', value: '', listItems: issueFields },
  ],
};

export const addCommentActionOutputSchema: OutputSchema = { fields: commentFields };

export const listCommentsActionOutputSchema: OutputSchema = {
  itemLabel: '{author_name}: {text}',
  fields: [
    { key: 'comments', label: 'Comments', value: '', listItems: commentListFields },
  ],
};

export const createTagActionOutputSchema: OutputSchema = {
  fields: [
    ...tagBaseFields,
    { key: 'untagOnResolve', label: 'Remove When Resolved', format: 'boolean' },
  ],
};

export const addTagToIssueActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Tag ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const listTagsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'tags',
      label: 'Tags',
      value: '',
      listItems: [
        ...tagBaseFields,
        { key: 'visible_for_name', label: 'Visible For' },
        { key: 'updateable_by_name', label: 'Updateable By' },
        { key: 'untag_on_resolve', label: 'Remove When Resolved', format: 'boolean' },
      ],
    },
  ],
};

export const removeTagFromIssueActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'issue_id', label: 'Issue ID' },
    { key: 'tag_id', label: 'Tag ID' },
  ],
};

export const listAttachmentsActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'attachments', label: 'Attachments', value: '', listItems: attachmentFields },
  ],
};

export const uploadAttachmentActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'attachments',
      label: 'Uploaded Attachments',
      value: '',
      listItems: uploadedAttachmentFields,
    },
  ],
};

export const downloadAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'file_name', label: 'File Name' },
    { key: 'attachment_id', label: 'Attachment ID' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'size_bytes', label: 'Size', format: 'filesize' },
    { key: 'base64_content', label: 'Base64 Content' },
  ],
};

export const deleteAttachmentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'issue_id', label: 'Issue ID' },
    { key: 'attachment_id', label: 'Attachment ID' },
  ],
};

export const getIssueHistoryActionOutputSchema: OutputSchema = {
  itemLabel: '{author_name}: {type}',
  fields: [
    { key: 'activities', label: 'Activities', value: '', listItems: activityFields },
  ],
};

export const applyCommandActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'command', label: 'Command' },
  ],
};

export const linkIssuesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'link_type', label: 'Link Type' },
    { key: 'target_issue', label: 'Target Issue' },
  ],
};

export const addUserToTeamActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'login', label: 'Login' },
  ],
};

export const newIssueTriggerOutputSchema: OutputSchema = { fields: issueFields };
export const updatedIssueTriggerOutputSchema: OutputSchema = { fields: issueFields };

export const listProjectsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Projects', labelKey: 'name', listItems: projectFields },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const getProjectActionOutputSchema: OutputSchema = {
  fields: [
    ...projectFields,
    { key: 'leader_id', label: 'Leader ID' },
    { key: 'team_id', label: 'Team ID' },
    { key: 'team_name', label: 'Team Name' },
    { key: 'time_tracking_enabled', label: 'Time Tracking Enabled', format: 'boolean' },
    { key: 'estimate_field', label: 'Estimation Field' },
    { key: 'time_spent_field', label: 'Spent Time Field' },
    {
      key: 'work_item_types',
      label: 'Work Types',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Work Type ID' },
        { key: 'name', label: 'Name' },
      ],
    },
  ],
};

export const listProjectCustomFieldsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'project_id', label: 'Project ID' },
    { key: 'fields_source', label: 'Fields Source', description: '"project settings" (needs project admin rights) or "sample issue".' },
    {
      key: 'fields',
      label: 'Custom Fields',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Field Name' },
        { key: 'fieldTypeId', label: 'Field Type' },
        { key: 'issueFieldType', label: 'Issue Field $type' },
        { key: 'isMultiValue', label: 'Multiple Values', format: 'boolean' },
        { key: 'required', label: 'Required', format: 'boolean' },
        { key: 'emptyFieldText', label: 'Empty Text' },
        { key: 'allowedValues', label: 'Allowed Values', description: 'List of allowed value names, or user logins for user fields (an array of strings). Empty when read from a sample issue.' },
        { key: 'allowedValuesTruncated', label: 'Allowed Values Truncated', format: 'boolean' },
      ],
    },
  ],
};

export const findUsersActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Users', labelKey: 'login', listItems: [...userRefFields, { key: 'online', label: 'Online', format: 'boolean' }] },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'scanLimitReached', label: 'Scan Limit Reached', format: 'boolean' },
  ],
};

export const getCurrentUserActionOutputSchema: OutputSchema = {
  fields: [...userRefFields, { key: 'timezone', label: 'Time Zone' }],
};

export const listGroupsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Groups',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Group ID' },
        { key: 'name', label: 'Name' },
        { key: 'usersCount', label: 'Members', format: 'number' },
      ],
    },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const listAgileBoardsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Agile Boards',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Board ID' },
        { key: 'name', label: 'Name' },
        { key: 'owner_login', label: 'Owner Login' },
        {
          key: 'projects',
          label: 'Projects',
          labelKey: 'shortName',
          listItems: [
            { key: 'id', label: 'Project ID' },
            { key: 'shortName', label: 'Short Name' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'current_sprint_id', label: 'Current Sprint ID' },
        { key: 'current_sprint_name', label: 'Current Sprint' },
        { key: 'sprints_enabled', label: 'Sprints Enabled', format: 'boolean' },
        { key: 'manual_sprint_assignment', label: 'Manual Sprint Assignment', format: 'boolean' },
      ],
    },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const listSprintsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Sprints', labelKey: 'name', listItems: sprintFields },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const createSprintActionOutputSchema: OutputSchema = { fields: sprintFields };

export const addIssueToSprintActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'board_id', label: 'Board ID' },
    { key: 'sprint_id', label: 'Sprint ID' },
    { key: 'issue_id', label: 'Issue Internal ID' },
    { key: 'issue_idReadable', label: 'Issue ID' },
    { key: 'issue_summary', label: 'Issue Summary' },
  ],
};

export const listLinkTypesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Link Types',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Link Type ID' },
        { key: 'name', label: 'Name' },
        { key: 'sourceToTarget', label: 'Outward Phrase' },
        { key: 'targetToSource', label: 'Inward Phrase' },
        { key: 'directed', label: 'Directed', format: 'boolean' },
        { key: 'aggregation', label: 'Aggregation', format: 'boolean' },
        { key: 'readOnly', label: 'Read Only', format: 'boolean' },
      ],
    },
  ],
};

export const getIssueLinksActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Linked Issues',
      labelKey: 'issue_idReadable',
      listItems: [
        { key: 'link_type', label: 'Link Type' },
        { key: 'direction', label: 'Direction' },
        { key: 'relation', label: 'Relation' },
        { key: 'issue_id', label: 'Issue Internal ID' },
        { key: 'issue_idReadable', label: 'Issue ID' },
        { key: 'issue_summary', label: 'Summary' },
        { key: 'issue_resolved', label: 'Resolved', format: 'datetime' },
      ],
    },
  ],
};

export const findWorkItemsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Work Items', labelKey: 'issue_idReadable', listItems: workItemFields },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const addWorkItemActionOutputSchema: OutputSchema = { fields: workItemFields };

export const deleteWorkItemActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'issue_id', label: 'Issue ID' },
    { key: 'work_item_id', label: 'Work Item ID' },
  ],
};

export const searchArticlesActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Articles', labelKey: 'summary', listItems: articleFields },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
    { key: 'scanLimitReached', label: 'Scan Limit Reached', format: 'boolean' },
  ],
};

export const getArticleActionOutputSchema: OutputSchema = { fields: articleDetailFields };
export const createArticleActionOutputSchema: OutputSchema = { fields: articleDetailFields };
export const updateArticleActionOutputSchema: OutputSchema = { fields: articleDetailFields };

export const listSavedSearchesActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Saved Searches',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Saved Search ID' },
        { key: 'name', label: 'Name' },
        { key: 'query', label: 'Query' },
        { key: 'owner_login', label: 'Owner Login' },
      ],
    },
    { key: 'hasMore', label: 'Has More', format: 'boolean' },
  ],
};

export const deleteIssueActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'issue_id', label: 'Issue ID' },
  ],
};

export const updateCommentActionOutputSchema: OutputSchema = { fields: commentListFields };

export const deleteCommentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'issue_id', label: 'Issue ID' },
    { key: 'comment_id', label: 'Comment ID' },
  ],
};
