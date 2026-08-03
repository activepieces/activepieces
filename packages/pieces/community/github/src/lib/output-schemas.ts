import { OutputSchema } from '@activepieces/pieces-framework';

const simpleUserFields: OutputSchema['fields'] = [
  { key: 'login', label: 'Username' },
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'html_url', label: 'Profile URL', format: 'url' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'type', label: 'Type' },
];

const gitAuthorFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'date', label: 'Date', format: 'datetime' },
];

const labelFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'description', label: 'Description' },
  { key: 'default', label: 'Default', format: 'boolean' },
];

const milestoneFields: OutputSchema['fields'] = [
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'state', label: 'State' },
  { key: 'open_issues', label: 'Open Issues', format: 'number' },
  { key: 'closed_issues', label: 'Closed Issues', format: 'number' },
  { key: 'due_on', label: 'Due On', format: 'datetime' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'creator', label: 'Creator', children: simpleUserFields },
];

const issueFields: OutputSchema['fields'] = [
  { key: 'number', label: 'Issue Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'state', label: 'State' },
  { key: 'state_reason', label: 'State Reason' },
  { key: 'body', label: 'Body' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'locked', label: 'Locked', format: 'boolean' },
  { key: 'comments', label: 'Comment Count', format: 'number' },
  { key: 'author_association', label: 'Author Association' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
  { key: 'user', label: 'Author', children: simpleUserFields },
  {
    key: 'assignees',
    label: 'Assignees',
    labelKey: 'login',
    listItems: simpleUserFields,
  },
  { key: 'labels', label: 'Labels', labelKey: 'name', listItems: labelFields },
  { key: 'milestone', label: 'Milestone', children: milestoneFields },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID', format: 'number' },
  { key: 'body', label: 'Body' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'author_association', label: 'Author Association' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'user', label: 'Author', children: simpleUserFields },
];

const gitRefFields: OutputSchema['fields'] = [
  { key: 'ref', label: 'Reference' },
  { key: 'url', label: 'API URL', format: 'url' },
  {
    key: 'object',
    label: 'Object',
    children: [
      { key: 'sha', label: 'SHA' },
      { key: 'type', label: 'Type' },
      { key: 'url', label: 'URL', format: 'url' },
    ],
  },
];

const branchFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'protected', label: 'Protected', format: 'boolean' },
  {
    key: 'commit',
    label: 'Commit',
    children: [
      { key: 'sha', label: 'SHA' },
      { key: 'html_url', label: 'URL', format: 'url' },
      {
        key: 'commit',
        label: 'Details',
        children: [
          { key: 'message', label: 'Message' },
          { key: 'author', label: 'Author', children: gitAuthorFields },
        ],
      },
    ],
  },
];

const gistFileFields: OutputSchema['fields'] = [
  { key: 'filename', label: 'Filename' },
  { key: 'type', label: 'Type' },
  { key: 'language', label: 'Language' },
  { key: 'raw_url', label: 'Raw URL', format: 'url' },
  { key: 'size', label: 'Size', format: 'filesize' },
];

const gistFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Gist ID' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'description', label: 'Description' },
  { key: 'public', label: 'Public', format: 'boolean' },
  { key: 'comments', label: 'Comment Count', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  {
    key: 'files',
    label: 'Files',
    dynamicKey: true,
    labelKey: 'filename',
    children: gistFileFields,
  },
  { key: 'owner', label: 'Owner', children: simpleUserFields },
];

const commitCommentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID', format: 'number' },
  { key: 'body', label: 'Body' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'path', label: 'File Path' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'line', label: 'Line', format: 'number' },
  { key: 'commit_id', label: 'Commit SHA' },
  { key: 'author_association', label: 'Author Association' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'user', label: 'Author', children: simpleUserFields },
];

const pullRequestReviewCommentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID', format: 'number' },
  { key: 'body', label: 'Body' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'path', label: 'File Path' },
  { key: 'line', label: 'Line', format: 'number' },
  { key: 'side', label: 'Side' },
  { key: 'start_line', label: 'Start Line', format: 'number' },
  { key: 'position', label: 'Position', format: 'number' },
  { key: 'commit_id', label: 'Commit SHA' },
  { key: 'diff_hunk', label: 'Diff Hunk' },
  { key: 'pull_request_url', label: 'Pull Request URL', format: 'url' },
  { key: 'author_association', label: 'Author Association' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'user', label: 'Author', children: simpleUserFields },
];

const userProfileFields: OutputSchema['fields'] = [
  { key: 'login', label: 'Username' },
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'html_url', label: 'Profile URL', format: 'url' },
  { key: 'avatar_url', label: 'Avatar', format: 'image' },
  { key: 'type', label: 'Type' },
  { key: 'company', label: 'Company' },
  { key: 'blog', label: 'Blog', format: 'url' },
  { key: 'location', label: 'Location' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'bio', label: 'Bio' },
  { key: 'twitter_username', label: 'Twitter Username' },
  { key: 'public_repos', label: 'Public Repos', format: 'number' },
  { key: 'public_gists', label: 'Public Gists', format: 'number' },
  { key: 'followers', label: 'Followers', format: 'number' },
  { key: 'following', label: 'Following', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const authenticatedUserFields: OutputSchema['fields'] = [
  ...userProfileFields,
  {
    key: 'total_private_repos',
    label: 'Total Private Repos',
    format: 'number',
  },
  {
    key: 'owned_private_repos',
    label: 'Owned Private Repos',
    format: 'number',
  },
  { key: 'private_gists', label: 'Private Gists', format: 'number' },
  { key: 'disk_usage', label: 'Disk Usage', format: 'number' },
  { key: 'collaborators', label: 'Collaborators', format: 'number' },
  {
    key: 'two_factor_authentication',
    label: 'Two-Factor Auth',
    format: 'boolean',
  },
  {
    key: 'plan',
    label: 'Plan',
    children: [
      { key: 'name', label: 'Name' },
      { key: 'space', label: 'Space', format: 'number' },
      { key: 'private_repos', label: 'Private Repos', format: 'number' },
      { key: 'collaborators', label: 'Collaborators', format: 'number' },
    ],
  },
];

const repositoryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Repository ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'full_name', label: 'Full Name' },
  { key: 'private', label: 'Private', format: 'boolean' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'description', label: 'Description' },
  { key: 'fork', label: 'Fork', format: 'boolean' },
  { key: 'owner', label: 'Owner', children: simpleUserFields },
  { key: 'homepage', label: 'Homepage', format: 'url' },
  { key: 'language', label: 'Language' },
  { key: 'default_branch', label: 'Default Branch' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'topics', label: 'Topics' },
  { key: 'stargazers_count', label: 'Stars', format: 'number' },
  { key: 'watchers_count', label: 'Watchers', format: 'number' },
  { key: 'forks_count', label: 'Forks', format: 'number' },
  { key: 'open_issues_count', label: 'Open Issues', format: 'number' },
  { key: 'size', label: 'Size', format: 'number' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'disabled', label: 'Disabled', format: 'boolean' },
  { key: 'has_issues', label: 'Has Issues', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'pushed_at', label: 'Pushed At', format: 'datetime' },
  {
    key: 'license',
    label: 'License',
    children: [
      { key: 'key', label: 'Key' },
      { key: 'name', label: 'Name' },
      { key: 'spdx_id', label: 'SPDX ID' },
    ],
  },
];

const prRefFields: OutputSchema['fields'] = [
  { key: 'label', label: 'Label' },
  { key: 'ref', label: 'Ref' },
  { key: 'sha', label: 'SHA' },
  { key: 'user', label: 'User', children: simpleUserFields },
];

const prFileFields: OutputSchema['fields'] = [
  { key: 'filename', label: 'Filename' },
  { key: 'status', label: 'Status' },
  { key: 'additions', label: 'Additions', format: 'number' },
  { key: 'deletions', label: 'Deletions', format: 'number' },
  { key: 'changes', label: 'Changes', format: 'number' },
  { key: 'sha', label: 'SHA' },
  { key: 'blob_url', label: 'Blob URL', format: 'url' },
  { key: 'raw_url', label: 'Raw URL', format: 'url' },
  { key: 'patch', label: 'Patch' },
];

const pullRequestFields: OutputSchema['fields'] = [
  { key: 'number', label: 'Number', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'state', label: 'State' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'body', label: 'Body' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'merge_commit_sha', label: 'Merge Commit SHA' },
  { key: 'author_association', label: 'Author Association' },
  { key: 'merged_at', label: 'Merged At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'closed_at', label: 'Closed At', format: 'datetime' },
  { key: 'user', label: 'Author', children: simpleUserFields },
  {
    key: 'assignees',
    label: 'Assignees',
    labelKey: 'login',
    listItems: simpleUserFields,
  },
  {
    key: 'requested_reviewers',
    label: 'Requested Reviewers',
    labelKey: 'login',
    listItems: simpleUserFields,
  },
  { key: 'labels', label: 'Labels', labelKey: 'name', listItems: labelFields },
  { key: 'milestone', label: 'Milestone', children: milestoneFields },
  { key: 'head', label: 'Head', children: prRefFields },
  { key: 'base', label: 'Base', children: prRefFields },
];

const pullRequestDetailFields: OutputSchema['fields'] = [
  ...pullRequestFields,
  { key: 'merged', label: 'Merged', format: 'boolean' },
  { key: 'mergeable', label: 'Mergeable', format: 'boolean' },
  { key: 'comments', label: 'Comment Count', format: 'number' },
  { key: 'review_comments', label: 'Review Comment Count', format: 'number' },
  { key: 'commits', label: 'Commit Count', format: 'number' },
  { key: 'additions', label: 'Additions', format: 'number' },
  { key: 'deletions', label: 'Deletions', format: 'number' },
  { key: 'changed_files', label: 'Changed Files', format: 'number' },
  { key: 'merged_by', label: 'Merged By', children: simpleUserFields },
];

const pullRequestReviewFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Review ID', format: 'number' },
  { key: 'state', label: 'State' },
  { key: 'body', label: 'Body' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'submitted_at', label: 'Submitted At', format: 'datetime' },
  { key: 'commit_id', label: 'Commit SHA' },
  { key: 'author_association', label: 'Author Association' },
  { key: 'user', label: 'Reviewer', children: simpleUserFields },
];

const releaseAssetFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'label', label: 'Label' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'state', label: 'State' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'download_count', label: 'Download Count', format: 'number' },
  { key: 'browser_download_url', label: 'Download URL', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'uploader', label: 'Uploader', children: simpleUserFields },
];

const releaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Release ID', format: 'number' },
  { key: 'tag_name', label: 'Tag Name' },
  { key: 'name', label: 'Name' },
  { key: 'body', label: 'Body' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'prerelease', label: 'Prerelease', format: 'boolean' },
  { key: 'target_commitish', label: 'Target Commitish' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'tarball_url', label: 'Tarball URL', format: 'url' },
  { key: 'zipball_url', label: 'Zipball URL', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'author', label: 'Author', children: simpleUserFields },
  {
    key: 'assets',
    label: 'Assets',
    labelKey: 'name',
    listItems: releaseAssetFields,
  },
];

const commitFields: OutputSchema['fields'] = [
  { key: 'sha', label: 'SHA' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'author', label: 'Author', children: simpleUserFields },
  { key: 'committer', label: 'Committer', children: simpleUserFields },
  {
    key: 'commit',
    label: 'Commit',
    children: [
      { key: 'message', label: 'Message' },
      { key: 'author', label: 'Author', children: gitAuthorFields },
      { key: 'committer', label: 'Committer', children: gitAuthorFields },
      { key: 'comment_count', label: 'Comment Count', format: 'number' },
    ],
  },
];

const commitDetailFields: OutputSchema['fields'] = [
  ...commitFields,
  {
    key: 'stats',
    label: 'Stats',
    children: [
      { key: 'total', label: 'Total', format: 'number' },
      { key: 'additions', label: 'Additions', format: 'number' },
      { key: 'deletions', label: 'Deletions', format: 'number' },
    ],
  },
  {
    key: 'files',
    label: 'Files',
    labelKey: 'filename',
    listItems: prFileFields,
  },
];

const contributorFields: OutputSchema['fields'] = [
  ...simpleUserFields,
  { key: 'contributions', label: 'Contributions', format: 'number' },
];

const collaboratorFields: OutputSchema['fields'] = [
  ...simpleUserFields,
  { key: 'role_name', label: 'Role' },
  {
    key: 'permissions',
    label: 'Permissions',
    children: [
      { key: 'admin', label: 'Admin', format: 'boolean' },
      { key: 'maintain', label: 'Maintain', format: 'boolean' },
      { key: 'push', label: 'Push', format: 'boolean' },
      { key: 'triage', label: 'Triage', format: 'boolean' },
      { key: 'pull', label: 'Pull', format: 'boolean' },
    ],
  },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'zipball_url', label: 'Zipball URL', format: 'url' },
  { key: 'tarball_url', label: 'Tarball URL', format: 'url' },
  {
    key: 'commit',
    label: 'Commit',
    children: [
      { key: 'sha', label: 'SHA' },
      { key: 'url', label: 'URL', format: 'url' },
    ],
  },
];

const treeItemFields: OutputSchema['fields'] = [
  { key: 'path', label: 'Path' },
  { key: 'mode', label: 'Mode' },
  { key: 'type', label: 'Type' },
  { key: 'sha', label: 'SHA' },
  { key: 'size', label: 'Size', format: 'number' },
  { key: 'url', label: 'URL', format: 'url' },
];

const treeFields: OutputSchema['fields'] = [
  { key: 'sha', label: 'SHA' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'truncated', label: 'Truncated', format: 'boolean' },
  { key: 'tree', label: 'Tree', labelKey: 'path', listItems: treeItemFields },
];

const fileContentFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path' },
  { key: 'sha', label: 'SHA' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'type', label: 'Type' },
  { key: 'encoding', label: 'Encoding' },
  { key: 'content', label: 'Content' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'download_url', label: 'Download URL', format: 'url' },
];

const fileContentMetaFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path' },
  { key: 'sha', label: 'SHA' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'type', label: 'Type' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'download_url', label: 'Download URL', format: 'url' },
];

const gitCommitFields: OutputSchema['fields'] = [
  { key: 'sha', label: 'SHA' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'message', label: 'Message' },
  { key: 'author', label: 'Author', children: gitAuthorFields },
  { key: 'committer', label: 'Committer', children: gitAuthorFields },
];

const codeSearchItemFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'path', label: 'Path' },
  { key: 'sha', label: 'SHA' },
  { key: 'html_url', label: 'URL', format: 'url' },
  { key: 'url', label: 'API URL', format: 'url' },
  { key: 'score', label: 'Score', format: 'number' },
  {
    key: 'repository',
    label: 'Repository',
    children: [
      { key: 'full_name', label: 'Full Name' },
      { key: 'html_url', label: 'URL', format: 'url' },
      { key: 'description', label: 'Description' },
    ],
  },
];

function listOutputSchema({
  listItems,
  labelKey,
}: {
  listItems: OutputSchema['fields'];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label: 'Items', labelKey, listItems },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  };
}

function searchOutputSchema({
  listItems,
  labelKey,
}: {
  listItems: OutputSchema['fields'];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: 'total_count', label: 'Total Count', format: 'number' },
      {
        key: 'incomplete_results',
        label: 'Incomplete Results',
        format: 'boolean',
      },
      { key: 'items', label: 'Items', labelKey, listItems },
    ],
  };
}

export const issueActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'issue', label: 'Issue', value: 'body', children: issueFields },
  ],
};

export const addLabelsToIssueActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'labels',
      label: 'Labels',
      value: 'body',
      labelKey: 'name',
      listItems: labelFields,
    },
  ],
};

export const createCommentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comment',
      label: 'Comment',
      value: 'body',
      children: commentFields,
    },
  ],
};

export const findIssueActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Matching Issues',
      labelKey: 'title',
      listItems: issueFields,
    },
  ],
};

export const createBranchActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'ref', label: 'Reference', value: 'body', children: gitRefFields },
  ],
};

export const findBranchActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'Branch', children: branchFields },
  ],
};

export const createGistActionOutputSchema: OutputSchema = {
  fields: [{ key: 'gist', label: 'Gist', value: 'body', children: gistFields }],
};

export const createCommitCommentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comment',
      label: 'Comment',
      value: 'body',
      children: commitCommentFields,
    },
  ],
};

export const createPullRequestReviewCommentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comment',
      label: 'Comment',
      value: 'body',
      children: pullRequestReviewCommentFields,
    },
  ],
};

export const findUserActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'result', label: 'User', children: userProfileFields },
  ],
};

export const issueBodyOutputSchema: OutputSchema = { fields: issueFields };
export const issueCommentBodyOutputSchema: OutputSchema = {
  fields: commentFields,
};
export const labelBodyOutputSchema: OutputSchema = { fields: labelFields };
export const milestoneBodyOutputSchema: OutputSchema = {
  fields: milestoneFields,
};
export const repositoryBodyOutputSchema: OutputSchema = {
  fields: repositoryFields,
};
export const pullRequestBodyOutputSchema: OutputSchema = {
  fields: pullRequestDetailFields,
};
export const pullRequestReviewBodyOutputSchema: OutputSchema = {
  fields: pullRequestReviewFields,
};
export const pullRequestReviewCommentBodyOutputSchema: OutputSchema = {
  fields: pullRequestReviewCommentFields,
};
export const releaseBodyOutputSchema: OutputSchema = { fields: releaseFields };
export const commitBodyOutputSchema: OutputSchema = {
  fields: commitDetailFields,
};
export const branchBodyOutputSchema: OutputSchema = { fields: branchFields };
export const gitRefBodyOutputSchema: OutputSchema = { fields: gitRefFields };
export const treeBodyOutputSchema: OutputSchema = { fields: treeFields };
export const fileContentBodyOutputSchema: OutputSchema = {
  fields: fileContentFields,
};
export const userBodyOutputSchema: OutputSchema = { fields: userProfileFields };
export const authenticatedUserBodyOutputSchema: OutputSchema = {
  fields: authenticatedUserFields,
};

export const fileMutationResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'content', label: 'Content', children: fileContentMetaFields },
    { key: 'commit', label: 'Commit', children: gitCommitFields },
  ],
};

export const compareCommitsOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'ahead_by', label: 'Ahead By', format: 'number' },
    { key: 'behind_by', label: 'Behind By', format: 'number' },
    { key: 'total_commits', label: 'Total Commits', format: 'number' },
    { key: 'html_url', label: 'URL', format: 'url' },
    { key: 'base_commit', label: 'Base Commit', children: commitFields },
    {
      key: 'commits',
      label: 'Commits',
      labelKey: 'sha',
      listItems: commitFields,
    },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'filename',
      listItems: prFileFields,
    },
  ],
};

export const labelsArrayOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'labels',
      label: 'Labels',
      value: '',
      labelKey: 'name',
      listItems: labelFields,
    },
  ],
};

export const languagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'languages', label: 'Languages', value: '', dynamicKey: true },
  ],
};

export const listAssigneesOutputSchema = listOutputSchema({
  listItems: simpleUserFields,
  labelKey: 'login',
});
export const listUsersOutputSchema = listOutputSchema({
  listItems: simpleUserFields,
  labelKey: 'login',
});
export const listBranchesOutputSchema = listOutputSchema({
  listItems: branchFields,
  labelKey: 'name',
});
export const listCommitsOutputSchema = listOutputSchema({
  listItems: commitFields,
  labelKey: 'sha',
});
export const listContributorsOutputSchema = listOutputSchema({
  listItems: contributorFields,
  labelKey: 'login',
});
export const listCollaboratorsOutputSchema = listOutputSchema({
  listItems: collaboratorFields,
  labelKey: 'login',
});
export const listIssueCommentsOutputSchema = listOutputSchema({
  listItems: commentFields,
  labelKey: 'id',
});
export const listLabelsOutputSchema = listOutputSchema({
  listItems: labelFields,
  labelKey: 'name',
});
export const listMilestonesOutputSchema = listOutputSchema({
  listItems: milestoneFields,
  labelKey: 'title',
});
export const listRepositoriesOutputSchema = listOutputSchema({
  listItems: repositoryFields,
  labelKey: 'name',
});
export const listIssuesOutputSchema = listOutputSchema({
  listItems: issueFields,
  labelKey: 'title',
});
export const listPullRequestsOutputSchema = listOutputSchema({
  listItems: pullRequestFields,
  labelKey: 'title',
});
export const listPullRequestFilesOutputSchema = listOutputSchema({
  listItems: prFileFields,
  labelKey: 'filename',
});
export const listPullRequestReviewCommentsOutputSchema = listOutputSchema({
  listItems: pullRequestReviewCommentFields,
  labelKey: 'id',
});
export const listPullRequestReviewsOutputSchema = listOutputSchema({
  listItems: pullRequestReviewFields,
  labelKey: 'state',
});
export const listReleasesOutputSchema = listOutputSchema({
  listItems: releaseFields,
  labelKey: 'name',
});
export const listTagsOutputSchema = listOutputSchema({
  listItems: tagFields,
  labelKey: 'name',
});

export const searchCodeOutputSchema = searchOutputSchema({
  listItems: codeSearchItemFields,
  labelKey: 'name',
});
export const searchIssuesOutputSchema = searchOutputSchema({
  listItems: issueFields,
  labelKey: 'title',
});
export const searchRepositoriesOutputSchema = searchOutputSchema({
  listItems: repositoryFields,
  labelKey: 'name',
});
export const searchUsersOutputSchema = searchOutputSchema({
  listItems: simpleUserFields,
  labelKey: 'login',
});

export const addCollaboratorOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Invitation ID', format: 'number' },
    { key: 'permissions', label: 'Permissions' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'html_url', label: 'URL', format: 'url' },
    { key: 'invitee', label: 'Invitee', children: simpleUserFields },
    { key: 'inviter', label: 'Inviter', children: simpleUserFields },
    {
      key: 'repository',
      label: 'Repository',
      children: [
        { key: 'full_name', label: 'Full Name' },
        { key: 'html_url', label: 'URL', format: 'url' },
        { key: 'private', label: 'Private', format: 'boolean' },
      ],
    },
  ],
};
