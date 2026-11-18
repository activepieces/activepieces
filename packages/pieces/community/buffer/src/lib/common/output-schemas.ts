import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const tagFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tag ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
];

const metricFields: OutputSchemaField[] = [
  { key: 'type', label: 'Metric Type', description: 'For example postCount, reactions, comments, impressions, reach, engagementRate.' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'unit', label: 'Unit', description: 'count or percentage.' },
  { key: 'value', label: 'Value', format: 'number' },
];

const channelFields: OutputSchemaField[] = [
  { key: 'id', label: 'Channel ID', description: 'Use it as the Channel ID when creating or listing posts.' },
  { key: 'name', label: 'Name' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'service', label: 'Service', description: 'bluesky, facebook, googlebusiness, instagram, linkedin, mastodon, pinterest, startPage, substack, threads, tiktok, twitter, whatsapp or youtube.' },
  { key: 'type', label: 'Channel Type', description: 'account, business, channel, group, page or profile.' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'descriptor', label: 'Descriptor' },
  { key: 'externalLink', label: 'Profile Link', format: 'url' },
  { key: 'isDisconnected', label: 'Disconnected', format: 'boolean', description: 'True when the channel must be reconnected in Buffer before it can publish.' },
  { key: 'isLocked', label: 'Locked', format: 'boolean', description: 'True when the plan does not allow posting to this channel.' },
  { key: 'isQueuePaused', label: 'Queue Paused', format: 'boolean' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'organizationId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Connected At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const channelDetailFields: OutputSchemaField[] = [
  ...channelFields,
  { key: 'serviceId', label: 'Service Account ID' },
  { key: 'allowedActions', label: 'Allowed Actions', description: 'What the API key owner may do on this channel, for example scheduleUpdates.' },
  {
    key: 'postingSchedule',
    label: 'Posting Schedule',
    labelKey: 'day',
    listItems: [
      { key: 'day', label: 'Day' },
      { key: 'times', label: 'Times', description: 'Queue slot times in the channel timezone, HH:mm.' },
      { key: 'paused', label: 'Paused', format: 'boolean' },
    ],
  },
  {
    key: 'postingGoal',
    label: 'Posting Goal',
    children: [
      { key: 'goal', label: 'Goal', format: 'number' },
      { key: 'sentCount', label: 'Sent', format: 'number' },
      { key: 'scheduledCount', label: 'Scheduled', format: 'number' },
      { key: 'periodStart', label: 'Period Start', format: 'datetime' },
      { key: 'periodEnd', label: 'Period End', format: 'datetime' },
      { key: 'status', label: 'Status' },
    ],
  },
  { key: 'linkShortening', label: 'Link Shortening', children: [{ key: 'isEnabled', label: 'Enabled', format: 'boolean' }] },
  {
    key: 'metadata',
    label: 'Service Settings',
    children: [
      { key: '__typename', label: 'Settings Type' },
      {
        key: 'boards',
        label: 'Pinterest Boards',
        labelKey: 'name',
        description: 'Pinterest only. Use serviceId as metadata.pinterest.boardServiceId when creating a pin.',
        listItems: [
          { key: 'serviceId', label: 'Board Service ID' },
          { key: 'name', label: 'Name' },
          { key: 'url', label: 'URL', format: 'url' },
          { key: 'description', label: 'Description' },
        ],
      },
      { key: 'serverUrl', label: 'Server URL', format: 'url', description: 'Mastodon and Bluesky only.' },
      { key: 'maxCharacters', label: 'Max Characters', format: 'number', description: 'Mastodon only.' },
      { key: 'defaultToReminders', label: 'Defaults to Reminders', format: 'boolean', description: 'Instagram, YouTube and TikTok only.' },
    ],
  },
];

const postFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post ID', description: 'Use it with Get a Post, Edit a Post or Delete a Post.' },
  { key: 'text', label: 'Text' },
  { key: 'status', label: 'Status', description: 'draft, needs_approval, scheduled, sending, sent or error.' },
  { key: 'dueAt', label: 'Scheduled For', format: 'datetime' },
  { key: 'sentAt', label: 'Sent At', format: 'datetime' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'channelId', label: 'Channel ID' },
  { key: 'channelService', label: 'Service' },
  { key: 'isCustomScheduled', label: 'Custom Scheduled', format: 'boolean' },
  { key: 'shareMode', label: 'Share Mode' },
  { key: 'schedulingType', label: 'Scheduling Type' },
  { key: 'sharedNow', label: 'Shared Now', format: 'boolean' },
  { key: 'via', label: 'Created Via', description: 'api, buffer or network.' },
  { key: 'externalLink', label: 'Published Link', format: 'url' },
  { key: 'ideaId', label: 'Idea ID' },
  { key: 'allowedActions', label: 'Allowed Actions', description: 'What may be done with the post now, for example updatePost or deletePost.' },
  {
    key: 'channel',
    label: 'Channel',
    children: [
      { key: 'id', label: 'Channel ID' },
      { key: 'name', label: 'Name' },
      { key: 'displayName', label: 'Display Name' },
      { key: 'service', label: 'Service' },
    ],
  },
  { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
  {
    key: 'error',
    label: 'Publishing Error',
    description: 'Set when the post status is error.',
    children: [
      { key: 'message', label: 'Message' },
      { key: 'rawError', label: 'Raw Error' },
      { key: 'supportUrl', label: 'Support URL', format: 'url' },
    ],
  },
  {
    key: 'assets',
    label: 'Media',
    labelKey: 'type',
    listItems: [
      { key: 'id', label: 'Asset ID' },
      { key: 'type', label: 'Type', description: 'image, video or document.' },
      { key: 'mimeType', label: 'MIME Type' },
      { key: 'source', label: 'Source URL', format: 'url' },
      { key: 'thumbnail', label: 'Thumbnail', format: 'image' },
    ],
  },
  { key: 'author', label: 'Author', children: [{ key: 'id', label: 'Author ID' }, { key: 'name', label: 'Name' }] },
  {
    key: 'metadata',
    label: 'Service Settings',
    children: [
      { key: '__typename', label: 'Settings Type', description: 'For example BlueskyPostMetadata or YoutubePostMetadata.' },
      {
        key: 'linkAttachment',
        label: 'Link Preview Card',
        description: 'Facebook, LinkedIn, Threads, Bluesky and Substack only. Empty when the post has no card.',
        children: [
          { key: 'url', label: 'Link URL', format: 'url' },
          { key: 'title', label: 'Card Title' },
          { key: 'text', label: 'Card Text' },
          { key: 'thumbnail', label: 'Card Image', format: 'image' },
        ],
      },
      { key: 'title', label: 'YouTube Title', description: 'YouTube only.' },
      { key: 'privacy', label: 'YouTube Privacy', description: 'YouTube only. public, private or unlisted.' },
      {
        key: 'category',
        label: 'YouTube Category',
        description: 'YouTube only.',
        children: [
          { key: 'categoryId', label: 'Category ID' },
          { key: 'title', label: 'Category Name' },
        ],
      },
    ],
  },
];

const postWithMetricsFields: OutputSchemaField[] = [
  ...postFields,
  { key: 'metrics', label: 'Metrics', labelKey: 'type', description: 'Only when Include Metrics is yes.', listItems: metricFields },
  { key: 'metricsUpdatedAt', label: 'Metrics Updated At', format: 'datetime', description: 'Only when Include Metrics is yes.' },
];

const triggerPostFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post ID' },
  { key: 'text', label: 'Text' },
  { key: 'status', label: 'Status', description: 'draft, needs_approval, scheduled, sending, sent or error.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  { key: 'dueAt', label: 'Scheduled For', format: 'datetime' },
  { key: 'sentAt', label: 'Sent At', format: 'datetime' },
  { key: 'channelId', label: 'Channel ID' },
  { key: 'channelService', label: 'Service' },
  {
    key: 'channel',
    label: 'Channel',
    children: [
      { key: 'id', label: 'Channel ID' },
      { key: 'name', label: 'Name' },
      { key: 'service', label: 'Service' },
    ],
  },
  { key: 'tags', label: 'Tags', labelKey: 'name', listItems: [{ key: 'id', label: 'Tag ID' }, { key: 'name', label: 'Name' }] },
];

const ideaContentFields: OutputSchemaField[] = [
  { key: 'title', label: 'Title' },
  { key: 'text', label: 'Text' },
  {
    key: 'media',
    label: 'Media',
    labelKey: 'url',
    listItems: [
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'type', label: 'Type' },
      { key: 'alt', label: 'Alt Text' },
    ],
  },
  { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
];

const pageFields: OutputSchemaField[] = [
  { key: 'nextCursor', label: 'Next Cursor', description: 'Pass it as Cursor to get the next page. Empty on the last page.' },
  { key: 'hasNextPage', label: 'Has Next Page', format: 'boolean' },
];

export const createPostOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'posts',
      label: 'Posts',
      description: 'One entry per channel, in the order the channels were given.',
      listItems: [
        { key: '__typename', label: 'Result Type' },
        {
          key: 'post',
          label: 'Post',
          children: [
            { key: 'id', label: 'Post ID' },
            { key: 'text', label: 'Text' },
            { key: 'status', label: 'Status' },
            { key: 'dueAt', label: 'Scheduled For', format: 'datetime' },
            { key: 'sentAt', label: 'Sent At', format: 'datetime' },
            { key: 'channelId', label: 'Channel ID' },
          ],
        },
      ],
    },
  ],
};

export const createIdeaOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'createIdea',
      label: 'Result',
      children: [
        { key: '__typename', label: 'Result Type' },
        {
          key: 'idea',
          label: 'Idea',
          children: [
            { key: 'id', label: 'Idea ID' },
            { key: 'organizationId', label: 'Organization ID' },
            { key: 'groupId', label: 'Group ID' },
            { key: 'createdAt', label: 'Created At (Unix seconds)', format: 'number' },
            { key: 'updatedAt', label: 'Updated At (Unix seconds)', format: 'number' },
            { key: 'content', label: 'Content', children: ideaContentFields },
          ],
        },
        { key: 'refreshIdeas', label: 'Refresh Ideas', format: 'boolean' },
      ],
    },
  ],
};

export const listOrganizationsOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Account ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'name', label: 'Name' },
    { key: 'timezone', label: 'Timezone', description: 'Use it to turn local times into ISO 8601 with an offset.' },
    {
      key: 'organizations',
      label: 'Organizations',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Organization ID', description: 'Use it as the Organization ID in other Buffer actions.' },
        { key: 'name', label: 'Name' },
        { key: 'channelCount', label: 'Channels', format: 'number' },
        { key: 'ownerEmail', label: 'Owner Email', format: 'email' },
        { key: 'members', label: 'Members', children: [{ key: 'totalCount', label: 'Member Count', format: 'number' }] },
        {
          key: 'limits',
          label: 'Plan Limits',
          children: [
            { key: 'channels', label: 'Channels', format: 'number' },
            { key: 'scheduledPosts', label: 'Scheduled Posts', format: 'number' },
            { key: 'ideas', label: 'Ideas', format: 'number' },
            { key: 'ideaGroups', label: 'Idea Groups', format: 'number' },
            { key: 'tags', label: 'Tags', format: 'number' },
            { key: 'members', label: 'Members', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const listChannelsOutputSchema: OutputSchema = {
  fields: [
    { key: 'channels', label: 'Channels', labelKey: 'name', listItems: channelFields },
  ],
};

export const getChannelOutputSchema: OutputSchema = {
  fields: channelDetailFields,
};

export const listPostsOutputSchema: OutputSchema = {
  fields: [
    { key: 'posts', label: 'Posts', labelKey: 'id', listItems: postWithMetricsFields },
    ...pageFields,
  ],
};

export const getPostOutputSchema: OutputSchema = {
  fields: postWithMetricsFields,
};

export const postOutputSchema: OutputSchema = {
  fields: postFields,
};

export const deletePostOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Deleted Post ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const listIdeasOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'ideas',
      label: 'Ideas',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Idea ID' },
        { key: 'organizationId', label: 'Organization ID' },
        { key: 'groupId', label: 'Group ID', description: 'Empty when the idea is not in a board column.' },
        { key: 'position', label: 'Position', format: 'number' },
        { key: 'createdAt', label: 'Created At (Unix seconds)', format: 'number' },
        { key: 'updatedAt', label: 'Updated At (Unix seconds)', format: 'number' },
        {
          key: 'content',
          label: 'Content',
          children: [
            { key: 'title', label: 'Title' },
            { key: 'text', label: 'Text' },
            { key: 'aiAssisted', label: 'AI Assisted', format: 'boolean' },
            { key: 'date', label: 'Target Date', format: 'datetime' },
            { key: 'services', label: 'Target Services' },
            {
              key: 'media',
              label: 'Media',
              labelKey: 'url',
              listItems: [
                { key: 'id', label: 'Media ID' },
                { key: 'url', label: 'URL', format: 'url' },
                { key: 'type', label: 'Type' },
                { key: 'alt', label: 'Alt Text' },
                { key: 'thumbnailUrl', label: 'Thumbnail', format: 'image' },
              ],
            },
            { key: 'tags', label: 'Tags', labelKey: 'name', listItems: tagFields },
          ],
        },
      ],
    },
    ...pageFields,
  ],
};

export const listIdeaGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'groups',
      label: 'Idea Groups',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Group ID' },
        { key: 'name', label: 'Name' },
        { key: 'isLocked', label: 'Locked', format: 'boolean' },
      ],
    },
  ],
};

export const getPostMetricsOutputSchema: OutputSchema = {
  fields: [
    { key: 'metrics', label: 'Metrics', labelKey: 'type', listItems: metricFields },
    { key: 'metricsUpdatedAt', label: 'Metrics Updated At', format: 'datetime', description: 'Empty when no post matched.' },
  ],
};

export const listTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'tags',
      label: 'Tags',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Tag ID' },
        { key: 'name', label: 'Name' },
        { key: 'color', label: 'Color' },
        { key: 'colorName', label: 'Color Name' },
        { key: 'isLocked', label: 'Locked', format: 'boolean' },
      ],
    },
    { key: 'totalCount', label: 'Total Tags', format: 'number' },
    ...pageFields,
  ],
};

export const channelTriggerOutputSchema: OutputSchema = {
  fields: channelFields,
};

export const postTriggerOutputSchema: OutputSchema = {
  fields: triggerPostFields,
};
