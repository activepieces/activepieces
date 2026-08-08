import { OutputSchema } from '@activepieces/pieces-framework';

// Shape returned by flattenIssue: nested objects become underscore-joined keys,
// and customFields keys vary per project, hence dynamicKey.
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
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
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
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
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
