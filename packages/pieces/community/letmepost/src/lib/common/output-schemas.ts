import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const vendorErrorFields: OutputSchemaField[] = [
  { key: 'code', label: 'Error Code' },
  { key: 'message', label: 'Error Message' },
  { key: 'rule', label: 'Rule', description: 'The preflight rule or validator that failed.' },
  { key: 'remediation', label: 'Remediation', description: 'Suggested next step to fix the failure.' },
];

const postAccountFields: OutputSchemaField[] = [
  { key: 'id', label: 'Account ID' },
  { key: 'platform', label: 'Platform' },
  { key: 'platformAccountId', label: 'Platform Account ID' },
  { key: 'displayName', label: 'Display Name' },
];

const postFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post ID', description: 'Use this id with Get a Post, Reschedule a Post or Cancel a Scheduled Post.' },
  { key: 'status', label: 'Status', description: 'queued, validated, publishing, published, failed, rejected or canceled.' },
  { key: 'platform', label: 'Platform' },
  { key: 'accountId', label: 'Account ID' },
  { key: 'profileId', label: 'Profile ID' },
  { key: 'account', label: 'Account', children: postAccountFields },
  { key: 'text', label: 'Text' },
  {
    key: 'mediaRefs',
    label: 'Media',
    labelKey: 'url',
    listItems: [
      { key: 'kind', label: 'Kind', description: 'image or video.' },
      { key: 'url', label: 'URL', format: 'url' },
    ],
  },
  { key: 'scheduledAt', label: 'Scheduled At', format: 'datetime' },
  { key: 'publishedAt', label: 'Published At', format: 'datetime' },
  { key: 'platformUri', label: 'Platform URI', description: 'Platform-native id of the published post, for example an at:// URI on Bluesky.' },
  { key: 'platformCid', label: 'Platform CID', description: 'Content id, Bluesky only.' },
  { key: 'error', label: 'Error', description: 'Set when the post failed or was rejected.', children: vendorErrorFields },
  { key: 'sandbox', label: 'Sandbox', format: 'boolean', description: 'True when created with a sandbox key; nothing was sent to the platform.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const postAttemptFields: OutputSchemaField[] = [
  { key: 'id', label: 'Attempt ID' },
  { key: 'attemptNumber', label: 'Attempt Number', format: 'number' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'finishedAt', label: 'Finished At', format: 'datetime' },
  { key: 'succeeded', label: 'Succeeded', format: 'boolean' },
  { key: 'errorCode', label: 'Error Code' },
  { key: 'errorMessage', label: 'Error Message' },
];

const postDetailFields: OutputSchemaField[] = [
  ...postFields,
  { key: 'attempts', label: 'Publish Attempts', labelKey: 'attemptNumber', listItems: postAttemptFields },
];

const targetResultFields: OutputSchemaField[] = [
  { key: 'postId', label: 'Post ID', description: 'letmepost post id for this target. Use it with Get a Post.' },
  { key: 'accountId', label: 'Account ID' },
  { key: 'platform', label: 'Platform' },
  { key: 'status', label: 'Status' },
  { key: 'uri', label: 'Platform URI' },
  { key: 'cid', label: 'Platform CID', description: 'Bluesky only. Needed with the URI to reply to this post.' },
  { key: 'firstCommentUri', label: 'First Comment URI' },
  { key: 'firstCommentCid', label: 'First Comment CID' },
  {
    key: 'warnings',
    label: 'Warnings',
    labelKey: 'code',
    listItems: [
      { key: 'code', label: 'Code' },
      { key: 'message', label: 'Message' },
    ],
  },
  { key: 'error', label: 'Error', children: vendorErrorFields },
];

const createPostResponseFields: OutputSchemaField[] = [
  { key: 'id', label: 'Batch ID', description: 'Identifies this publish request only. It cannot be used with Get a Post; use Post IDs instead.' },
  { key: 'status', label: 'Batch Status', description: 'queued, published or partial_failed.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'scheduledAt', label: 'Scheduled At', format: 'datetime', description: 'Set when the post was scheduled.' },
  { key: 'postIds', label: 'Post IDs', description: 'One letmepost post id per target, for Get a Post.' },
  { key: 'results', label: 'Per-Target Results', labelKey: 'platform', listItems: targetResultFields },
];

const accountFields: OutputSchemaField[] = [
  { key: 'id', label: 'Account ID' },
  { key: 'platform', label: 'Platform' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'profileId', label: 'Profile ID' },
  { key: 'platformAccountId', label: 'Platform Account ID' },
  { key: 'tokenExpiresAt', label: 'Token Expires At', format: 'datetime' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  {
    key: 'pinterest',
    label: 'Pinterest',
    description: 'Pinterest accounts only.',
    children: [
      { key: 'defaultBoardId', label: 'Default Board ID' },
      { key: 'defaultBoardName', label: 'Default Board Name' },
    ],
  },
  {
    key: 'instagram',
    label: 'Instagram',
    description: 'Instagram accounts only.',
    children: [
      { key: 'kind', label: 'Kind' },
      { key: 'accountType', label: 'Account Type' },
    ],
  },
];

const mediaFields: OutputSchemaField[] = [
  { key: 'id', label: 'Media ID', description: 'Use it as Media ID when publishing a post.' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'sizeBytes', label: 'Size', format: 'filesize' },
  { key: 'sha256', label: 'SHA-256' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const boardFields: OutputSchemaField[] = [
  { key: 'id', label: 'Board ID' },
  { key: 'name', label: 'Name' },
  { key: 'privacy', label: 'Privacy', description: 'PUBLIC, PROTECTED or SECRET.' },
];

export const publishPostOutputSchema: OutputSchema = { fields: createPostResponseFields };

export const getPostOutputSchema: OutputSchema = { fields: postDetailFields };

export const postOutputSchema: OutputSchema = { fields: postFields };

export const listPostsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Posts', labelKey: 'id', listItems: postFields },
    { key: 'nextCursor', label: 'Next Cursor', description: 'Pass it as Cursor to get the next page. Empty on the last page.' },
  ],
};

export const cancelPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Post ID' },
    { key: 'status', label: 'Status' },
  ],
};

export const accountOutputSchema: OutputSchema = { fields: accountFields };

export const listAccountsOutputSchema: OutputSchema = {
  itemLabel: '{displayName} ({platform})',
  fields: [{ key: 'accounts', label: 'Accounts', value: '', listItems: accountFields }],
};

export const listMediaOutputSchema: OutputSchema = {
  itemLabel: '{id}',
  fields: [
    {
      key: 'media',
      label: 'Media',
      value: '',
      listItems: [...mediaFields, { key: 'profileId', label: 'Profile ID' }],
    },
  ],
};

export const uploadMediaOutputSchema: OutputSchema = { fields: mediaFields };

export const listPinterestBoardsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Boards', labelKey: 'name', listItems: boardFields },
    { key: 'defaultBoardId', label: 'Default Board ID' },
  ],
};

export const newPublishedPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Post ID' },
    { key: 'account_id', label: 'Account ID' },
    { key: 'account_display_name', label: 'Account Display Name' },
    { key: 'profile_id', label: 'Profile ID' },
    { key: 'platform', label: 'Platform' },
    { key: 'status', label: 'Status' },
    { key: 'text', label: 'Text' },
    { key: 'published_at', label: 'Published At', format: 'datetime' },
    { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
    { key: 'created_at', label: 'Created At', format: 'datetime' },
    { key: 'platform_url', label: 'Platform URI', description: 'Platform-native id of the post, for example an at:// URI on Bluesky.' },
    { key: 'platform_cid', label: 'Platform CID', description: 'Bluesky only.' },
  ],
};

export const postEventOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event ID' },
    { key: 'type', label: 'Event Type', description: 'For example post.published or post.failed.' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'organizationId', label: 'Organization ID' },
    {
      key: 'data',
      label: 'Event Data',
      description: 'Fields depend on the event type. For post events data.id is the letmepost post id. Test deliveries sent from the letmepost dashboard use data.postId instead of data.id.',
      children: [
        { key: 'id', label: 'Post ID' },
        { key: 'platform', label: 'Platform' },
        { key: 'accountId', label: 'Account ID' },
        { key: 'profileId', label: 'Profile ID' },
        { key: 'publishedAt', label: 'Published At', format: 'datetime', description: 'post.published only.' },
        { key: 'scheduledAt', label: 'Scheduled At', format: 'datetime', description: 'post.queued, post.rescheduled and post.canceled.' },
        { key: 'uri', label: 'Platform URI', description: 'post.published only, for example an at:// URI on Bluesky.' },
        { key: 'cid', label: 'Platform CID', description: 'post.published on Bluesky only.' },
        {
          key: 'warnings',
          label: 'Warnings',
          labelKey: 'code',
          listItems: [
            { key: 'code', label: 'Code' },
            { key: 'message', label: 'Message' },
          ],
        },
        { key: 'sandbox', label: 'Sandbox', format: 'boolean', description: 'True when created with a sandbox key; nothing was sent to the platform.' },
      ],
    },
  ],
};
