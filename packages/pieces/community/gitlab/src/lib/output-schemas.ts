import {
  OutputSchema,
  OutputSchemaField,
} from '@activepieces/pieces-framework';

type Fields = OutputSchemaField[];

const pageFields = ({
  label,
  itemFields,
  labelKey,
}: {
  label: string;
  itemFields: Fields;
  labelKey: string;
}): Fields => [
  { key: 'items', label, labelKey, listItems: itemFields },
  { key: 'count', label: 'Items on This Page', format: 'number' },
  { key: 'page', label: 'Page', format: 'number' },
  {
    key: 'nextPage',
    label: 'Next Page',
    format: 'number',
    description: 'Pass as Page to fetch more. Empty on the last page.',
  },
  { key: 'hasMore', label: 'Has More', format: 'boolean' },
  {
    key: 'total',
    label: 'Total',
    format: 'number',
    description:
      'Total items when GitLab reports it; empty for very large lists.',
  },
];

const userRefFields: Fields = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'state', label: 'State' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'web_url', label: 'Profile URL', format: 'url' },
];

const milestoneRefFields: Fields = [
  { key: 'id', label: 'Milestone ID', format: 'number' },
  { key: 'iid', label: 'Milestone IID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'state', label: 'State' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

const issueFields: Fields = [
  { key: 'id', label: 'Issue ID', format: 'number' },
  { key: 'iid', label: 'Issue IID', format: 'number' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'state', label: 'State' },
  { key: 'labels', label: 'Labels' },
  { key: 'author', label: 'Author', children: userRefFields },
  {
    key: 'assignees',
    label: 'Assignees',
    labelKey: 'username',
    listItems: userRefFields,
  },
  { key: 'milestone', label: 'Milestone', children: milestoneRefFields },
  { key: 'confidential', label: 'Confidential', format: 'boolean' },
  { key: 'discussion_locked', label: 'Discussion Locked', format: 'boolean' },
  { key: 'due_date', label: 'Due Date', format: 'date' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
  { key: 'closed_by', label: 'Closed By', children: userRefFields },
  { key: 'user_notes_count', label: 'Comment Count', format: 'number' },
  { key: 'issue_type', label: 'Type' },
  { key: 'web_url', label: 'URL', format: 'url' },
  {
    key: 'time_stats',
    label: 'Time Tracking',
    children: [
      { key: 'time_estimate', label: 'Estimate (seconds)', format: 'number' },
      {
        key: 'total_time_spent',
        label: 'Time Spent (seconds)',
        format: 'number',
      },
    ],
  },
  {
    key: 'references',
    label: 'References',
    children: [{ key: 'full', label: 'Full Reference' }],
  },
];

export const issueOutputSchema: OutputSchema = { fields: issueFields };
export const issueListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Issues',
    itemFields: issueFields,
    labelKey: 'title',
  }),
};

const noteFields: Fields = [
  { key: 'id', label: 'Note ID', format: 'number' },
  { key: 'body', label: 'Body' },
  { key: 'author', label: 'Author', children: userRefFields },
  { key: 'system', label: 'System Note', format: 'boolean' },
  { key: 'internal', label: 'Internal', format: 'boolean' },
  { key: 'noteable_type', label: 'Attached To' },
  { key: 'noteable_iid', label: 'Attached To IID', format: 'number' },
  { key: 'resolvable', label: 'Resolvable', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const noteOutputSchema: OutputSchema = { fields: noteFields };
export const noteListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Comments',
    itemFields: noteFields,
    labelKey: 'id',
  }),
};
export const deletedNoteOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'noteId', label: 'Note ID', format: 'number' },
    { key: 'issueIid', label: 'Issue IID', format: 'number' },
  ],
};

export const timeStatsOutputSchema: OutputSchema = {
  fields: [
    { key: 'time_estimate', label: 'Estimate (seconds)', format: 'number' },
    {
      key: 'total_time_spent',
      label: 'Time Spent (seconds)',
      format: 'number',
    },
    { key: 'human_time_estimate', label: 'Estimate' },
    { key: 'human_total_time_spent', label: 'Time Spent' },
  ],
};

const mergeRequestFields: Fields = [
  { key: 'id', label: 'Merge Request ID', format: 'number' },
  { key: 'iid', label: 'Merge Request IID', format: 'number' },
  { key: 'project_id', label: 'Project ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'state', label: 'State' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'source_branch', label: 'Source Branch' },
  { key: 'target_branch', label: 'Target Branch' },
  { key: 'sha', label: 'Head SHA' },
  { key: 'merge_commit_sha', label: 'Merge Commit SHA' },
  { key: 'squash_commit_sha', label: 'Squash Commit SHA' },
  { key: 'detailed_merge_status', label: 'Merge Status' },
  { key: 'has_conflicts', label: 'Has Conflicts', format: 'boolean' },
  { key: 'labels', label: 'Labels' },
  { key: 'author', label: 'Author', children: userRefFields },
  {
    key: 'assignees',
    label: 'Assignees',
    labelKey: 'username',
    listItems: userRefFields,
  },
  {
    key: 'reviewers',
    label: 'Reviewers',
    labelKey: 'username',
    listItems: userRefFields,
  },
  { key: 'milestone', label: 'Milestone', children: milestoneRefFields },
  { key: 'merged_by', label: 'Merged By', children: userRefFields },
  { key: 'merged_at', label: 'Merged At', format: 'datetime' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'squash', label: 'Squash on Merge', format: 'boolean' },
  {
    key: 'force_remove_source_branch',
    label: 'Delete Source Branch on Merge',
    format: 'boolean',
  },
  { key: 'user_notes_count', label: 'Comment Count', format: 'number' },
  { key: 'web_url', label: 'URL', format: 'url' },
  {
    key: 'references',
    label: 'References',
    children: [{ key: 'full', label: 'Full Reference' }],
  },
];

export const mergeRequestOutputSchema: OutputSchema = {
  fields: mergeRequestFields,
};
export const mergeRequestListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Merge Requests',
    itemFields: mergeRequestFields,
    labelKey: 'title',
  }),
};
export const deletedMergeRequestOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'mergeRequestIid', label: 'Merge Request IID', format: 'number' },
  ],
};

export const approvalsOutputSchema: OutputSchema = {
  fields: [
    { key: 'iid', label: 'Merge Request IID', format: 'number' },
    { key: 'approved', label: 'Approved', format: 'boolean' },
    {
      key: 'approvals_required',
      label: 'Approvals Required',
      format: 'number',
    },
    { key: 'approvals_left', label: 'Approvals Left', format: 'number' },
    {
      key: 'user_has_approved',
      label: 'Connected User Approved',
      format: 'boolean',
    },
    {
      key: 'user_can_approve',
      label: 'Connected User Can Approve',
      format: 'boolean',
    },
    {
      key: 'approved_by',
      label: 'Approved By',
      listItems: [{ key: 'user', label: 'User', children: userRefFields }],
    },
    { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  ],
};

export const draftNoteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Draft Note ID', format: 'number' },
    { key: 'author_id', label: 'Author ID', format: 'number' },
    { key: 'merge_request_id', label: 'Merge Request ID', format: 'number' },
    { key: 'note', label: 'Comment' },
    { key: 'discussion_id', label: 'Discussion ID' },
    {
      key: 'resolve_discussion',
      label: 'Resolves Discussion',
      format: 'boolean',
    },
  ],
};

export const discussionListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Discussions',
    itemFields: [
      { key: 'id', label: 'Discussion ID' },
      { key: 'individual_note', label: 'Single Comment', format: 'boolean' },
      {
        key: 'notes',
        label: 'Comments',
        labelKey: 'id',
        listItems: [...noteFields],
      },
    ],
    labelKey: 'id',
  }),
};

export const diffListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Changed Files',
    itemFields: [
      { key: 'old_path', label: 'Old Path' },
      { key: 'new_path', label: 'New Path' },
      { key: 'new_file', label: 'New File', format: 'boolean' },
      { key: 'renamed_file', label: 'Renamed', format: 'boolean' },
      { key: 'deleted_file', label: 'Deleted', format: 'boolean' },
      { key: 'generated_file', label: 'Generated', format: 'boolean' },
      { key: 'diff', label: 'Diff' },
      { key: 'diffTruncated', label: 'Diff Truncated', format: 'boolean' },
    ],
    labelKey: 'new_path',
  }),
};

export const diffVersionListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Diff Versions',
    itemFields: [
      { key: 'id', label: 'Version ID', format: 'number' },
      { key: 'head_commit_sha', label: 'Head SHA' },
      { key: 'base_commit_sha', label: 'Base SHA' },
      { key: 'start_commit_sha', label: 'Start SHA' },
      { key: 'state', label: 'State' },
      { key: 'real_size', label: 'Changed Files' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
    labelKey: 'id',
  }),
};

const commitFields: Fields = [
  { key: 'id', label: 'SHA' },
  { key: 'short_id', label: 'Short SHA' },
  { key: 'title', label: 'Title' },
  { key: 'message', label: 'Message' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'author_email', label: 'Author Email', format: 'email' },
  { key: 'authored_date', label: 'Authored At', format: 'datetime' },
  { key: 'committer_name', label: 'Committer Name' },
  { key: 'committed_date', label: 'Committed At', format: 'datetime' },
  { key: 'parent_ids', label: 'Parent SHAs' },
  { key: 'web_url', label: 'URL', format: 'url' },
];

export const commitOutputSchema: OutputSchema = {
  fields: [
    ...commitFields,
    {
      key: 'stats',
      label: 'Stats',
      children: [
        { key: 'additions', label: 'Additions', format: 'number' },
        { key: 'deletions', label: 'Deletions', format: 'number' },
        { key: 'total', label: 'Total', format: 'number' },
      ],
    },
    {
      key: 'last_pipeline',
      label: 'Last Pipeline',
      children: [
        { key: 'id', label: 'Pipeline ID', format: 'number' },
        { key: 'status', label: 'Status' },
        { key: 'web_url', label: 'URL', format: 'url' },
      ],
    },
  ],
};
export const commitListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Commits',
    itemFields: commitFields,
    labelKey: 'title',
  }),
};

export const commitRefListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Refs',
    itemFields: [
      { key: 'type', label: 'Type' },
      { key: 'name', label: 'Name' },
    ],
    labelKey: 'name',
  }),
};

export const commitSequenceOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Sequence Number', format: 'number' }],
};

const commitCommentFields: Fields = [
  { key: 'note', label: 'Comment' },
  { key: 'path', label: 'File Path' },
  { key: 'line', label: 'Line', format: 'number' },
  { key: 'line_type', label: 'Line Type' },
  { key: 'author', label: 'Author', children: userRefFields },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const commitCommentOutputSchema: OutputSchema = {
  fields: [
    ...commitCommentFields,
    { key: 'lineAnchored', label: 'Anchored to Line', format: 'boolean' },
  ],
};
export const commitCommentListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Comments',
    itemFields: commitCommentFields,
    labelKey: 'note',
  }),
};

export const fileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file_name', label: 'File Name' },
    { key: 'file_path', label: 'File Path' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'content', label: 'Content' },
    { key: 'isBinary', label: 'Binary', format: 'boolean' },
    { key: 'truncated', label: 'Truncated', format: 'boolean' },
    { key: 'ref', label: 'Ref' },
    { key: 'blob_id', label: 'Blob ID' },
    { key: 'commit_id', label: 'Commit ID' },
    { key: 'last_commit_id', label: 'Last Commit ID' },
    { key: 'content_sha256', label: 'SHA-256' },
  ],
};

export const fileCommitOutputSchema: OutputSchema = {
  fields: [
    { key: 'file_path', label: 'File Path' },
    { key: 'branch', label: 'Branch' },
  ],
};

export const deletedFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'file_path', label: 'File Path' },
    { key: 'branch', label: 'Branch' },
  ],
};

export const treeListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Entries',
    itemFields: [
      { key: 'id', label: 'Object ID' },
      { key: 'name', label: 'Name' },
      {
        key: 'type',
        label: 'Type',
        description: 'blob (file) or tree (folder).',
      },
      { key: 'path', label: 'Path' },
      { key: 'mode', label: 'Mode' },
    ],
    labelKey: 'path',
  }),
};

const branchFields: Fields = [
  { key: 'name', label: 'Name' },
  { key: 'merged', label: 'Merged', format: 'boolean' },
  { key: 'protected', label: 'Protected', format: 'boolean' },
  { key: 'default', label: 'Default Branch', format: 'boolean' },
  {
    key: 'developers_can_push',
    label: 'Developers Can Push',
    format: 'boolean',
  },
  {
    key: 'developers_can_merge',
    label: 'Developers Can Merge',
    format: 'boolean',
  },
  { key: 'can_push', label: 'Connected User Can Push', format: 'boolean' },
  { key: 'web_url', label: 'URL', format: 'url' },
  { key: 'commit', label: 'Latest Commit', children: commitFields },
];

export const branchOutputSchema: OutputSchema = { fields: branchFields };
export const branchListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Branches',
    itemFields: branchFields,
    labelKey: 'name',
  }),
};
export const deletedBranchOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'branch', label: 'Branch' },
  ],
};

const accessLevelFields: Fields = [
  { key: 'access_level', label: 'Access Level', format: 'number' },
  { key: 'access_level_description', label: 'Description' },
];

export const protectedBranchOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Protection ID', format: 'number' },
    { key: 'name', label: 'Branch or Pattern' },
    { key: 'allow_force_push', label: 'Allow Force Push', format: 'boolean' },
    {
      key: 'push_access_levels',
      label: 'Allowed to Push',
      labelKey: 'access_level_description',
      listItems: accessLevelFields,
    },
    {
      key: 'merge_access_levels',
      label: 'Allowed to Merge',
      labelKey: 'access_level_description',
      listItems: accessLevelFields,
    },
  ],
};

export const unprotectedBranchOutputSchema: OutputSchema = {
  fields: [
    { key: 'unprotected', label: 'Unprotected', format: 'boolean' },
    {
      key: 'alreadyUnprotected',
      label: 'Was Not Protected',
      format: 'boolean',
    },
    { key: 'name', label: 'Branch or Pattern' },
  ],
};

export const tagListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Tags',
    itemFields: [
      { key: 'name', label: 'Name' },
      { key: 'message', label: 'Message' },
      { key: 'target', label: 'Target SHA' },
      { key: 'protected', label: 'Protected', format: 'boolean' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'commit', label: 'Commit', children: commitFields },
      {
        key: 'release',
        label: 'Release',
        children: [
          { key: 'tag_name', label: 'Tag Name' },
          { key: 'description', label: 'Description' },
        ],
      },
    ],
    labelKey: 'name',
  }),
};

const userFields: Fields = [
  ...userRefFields,
  { key: 'public_email', label: 'Public Email', format: 'email' },
  { key: 'bio', label: 'Bio' },
  { key: 'location', label: 'Location' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'organization', label: 'Organization' },
  { key: 'bot', label: 'Bot', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

export const userOutputSchema: OutputSchema = { fields: userFields };
export const currentUserOutputSchema: OutputSchema = {
  fields: [
    ...userFields,
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'commit_email', label: 'Commit Email', format: 'email' },
    { key: 'last_activity_on', label: 'Last Activity', format: 'date' },
    {
      key: 'can_create_project',
      label: 'Can Create Projects',
      format: 'boolean',
    },
    { key: 'can_create_group', label: 'Can Create Groups', format: 'boolean' },
  ],
};
export const userListOutputSchema: OutputSchema = {
  fields: pageFields({
    label: 'Users',
    itemFields: userRefFields,
    labelKey: 'username',
  }),
};

export const userStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'emoji', label: 'Emoji' },
    { key: 'message', label: 'Message' },
    { key: 'availability', label: 'Availability' },
    { key: 'clear_status_at', label: 'Clears At', format: 'datetime' },
  ],
};

export const issueEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'object_kind', label: 'Event Kind' },
    {
      key: 'event_type',
      label: 'Event Type',
      description: 'issue or confidential_issue.',
    },
    {
      key: 'user',
      label: 'Triggered By',
      children: [
        { key: 'id', label: 'User ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'username', label: 'Username' },
      ],
    },
    {
      key: 'project',
      label: 'Project',
      children: [
        { key: 'id', label: 'Project ID', format: 'number' },
        { key: 'name', label: 'Name' },
        { key: 'path_with_namespace', label: 'Full Path' },
        { key: 'web_url', label: 'URL', format: 'url' },
        { key: 'default_branch', label: 'Default Branch' },
      ],
    },
    {
      key: 'object_attributes',
      label: 'Issue',
      children: [
        { key: 'id', label: 'Issue ID', format: 'number' },
        { key: 'iid', label: 'Issue IID', format: 'number' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'state', label: 'State' },
        {
          key: 'action',
          label: 'Action',
          description: 'open, close, reopen or update.',
        },
        { key: 'confidential', label: 'Confidential', format: 'boolean' },
        { key: 'due_date', label: 'Due Date', format: 'date' },
        { key: 'created_at', label: 'Created At' },
        { key: 'updated_at', label: 'Updated At' },
        { key: 'url', label: 'URL', format: 'url' },
      ],
    },
    { key: 'labels', label: 'Labels' },
    { key: 'changes', label: 'Changes', dynamicKey: true },
  ],
};
