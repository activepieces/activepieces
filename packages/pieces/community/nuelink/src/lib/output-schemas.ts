import { OutputSchema } from '@activepieces/pieces-framework';

const pagingFields: OutputSchema['fields'] = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'perPage', label: 'Results per Page', format: 'number' },
  { key: 'total', label: 'Total Matching', format: 'number' },
  { key: 'lastPage', label: 'Last Page', format: 'number' },
  { key: 'hasMore', label: 'Has More Pages', format: 'boolean' },
];

const postFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID', format: 'number' },
  { key: 'collectionId', label: 'Collection ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'body', label: 'Caption' },
  { key: 'media', label: 'Media', labelKey: 'id', listItems: [{ key: 'id', label: 'Media ID' }] },
  { key: 'postType', label: 'Post Type' },
  { key: 'postingType', label: 'Publish Mode' },
  { key: 'status', label: 'Status' },
  { key: 'postDate', label: 'Scheduled For (UTC)', description: 'UTC time in the format YYYY-MM-DD HH:MM:SS; empty unless the post is scheduled.' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
  {
    key: 'poll',
    label: 'Poll',
    children: [
      { key: 'question', label: 'Question' },
      { key: 'options', label: 'Options' },
      { key: 'caption', label: 'Caption' },
      { key: 'period', label: 'Duration' },
      { key: 'correctOptionIndex', label: 'Correct Option Index', format: 'number' },
      { key: 'explanation', label: 'Explanation' },
    ],
  },
];

const publishedPostFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Published Result ID', format: 'number' },
  { key: 'postId', label: 'Post ID', format: 'number' },
  { key: 'collectionId', label: 'Collection ID', format: 'number' },
  {
    key: 'channel',
    label: 'Channel',
    children: [
      { key: 'id', label: 'Channel ID', format: 'number' },
      { key: 'name', label: 'Channel Name' },
      { key: 'type', label: 'Platform' },
    ],
  },
  { key: 'postType', label: 'Post Type' },
  { key: 'body', label: 'Published Text' },
  { key: 'url', label: 'Post URL', format: 'url' },
  { key: 'status', label: 'Delivery Status' },
  { key: 'message', label: 'Delivery Message' },
  { key: 'publishedAt', label: 'Published At', format: 'datetime' },
  {
    key: 'results',
    label: 'Engagement',
    children: [
      { key: 'likes', label: 'Likes', format: 'number' },
      { key: 'comments', label: 'Comments', format: 'number' },
      { key: 'shares', label: 'Shares', format: 'number' },
      { key: 'views', label: 'Views', format: 'number' },
      { key: 'saves', label: 'Saves', format: 'number' },
      { key: 'engagement', label: 'Engagement', format: 'number' },
      { key: 'clicks', label: 'Clicks', format: 'number' },
      { key: 'impressions', label: 'Impressions', format: 'number' },
      { key: 'reach', label: 'Reach', format: 'number' },
    ],
  },
];

const brandFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Brand ID', format: 'number' },
  { key: 'title', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'timezone', label: 'Timezone' },
  { key: 'queueStatus', label: 'Queue Status' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const collectionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Collection ID', format: 'number' },
  { key: 'title', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'timezone', label: 'Timezone' },
  {
    key: 'evergreen',
    label: 'Evergreen',
    children: [
      { key: 'enabled', label: 'Enabled', format: 'boolean' },
      { key: 'maxRepublish', label: 'Max Republish', format: 'number' },
    ],
  },
  {
    key: 'channels',
    label: 'Channels',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Channel ID', format: 'number' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
      { key: 'type', label: 'Platform' },
    ],
  },
  {
    key: 'queues',
    label: 'Queue Slots',
    labelKey: 'date',
    listItems: [
      { key: 'id', label: 'Slot ID', format: 'number' },
      { key: 'day', label: 'Day' },
      { key: 'time', label: 'Time (Brand Timezone)' },
      { key: 'date', label: 'Day and Time' },
      { key: 'status', label: 'Status' },
    ],
  },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const collectionPostCountsField: OutputSchema['fields'][number] = {
  key: 'postsCount',
  label: 'Post Counts',
  children: [
    { key: 'queued', label: 'Queued', format: 'number' },
    { key: 'scheduled', label: 'Scheduled', format: 'number' },
    { key: 'drafts', label: 'Drafts', format: 'number' },
    { key: 'published', label: 'Published', format: 'number' },
  ],
};

const evergreenIntervalField: OutputSchema['fields'][number] = { key: 'maxRepublish', label: 'Evergreen Interval (weeks)', format: 'number' };

const WEEKDAYS: Array<[string, string]> = [
  ['MON', 'Monday'],
  ['TUE', 'Tuesday'],
  ['WED', 'Wednesday'],
  ['THU', 'Thursday'],
  ['FRI', 'Friday'],
  ['SAT', 'Saturday'],
  ['SUN', 'Sunday'],
];

const automationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Automation ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'collectionId', label: 'Collection ID', format: 'number' },
  { key: 'status', label: 'Status', description: 'ACTIVE, or INACTIVE when paused.' },
  { key: 'type', label: 'Feed Type' },
  { key: 'feedUrl', label: 'Feed URL', format: 'url' },
  { key: 'runCount', label: 'Run Count', format: 'number' },
  { key: 'importAsType', label: 'Import As' },
  { key: 'lastRun', label: 'Last Run (Unix Time)', format: 'number', description: '0 means it has not run yet.' },
  { key: 'title', label: 'Title Template' },
  { key: 'caption', label: 'Caption Template' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const scheduleSlotFields: OutputSchema['fields'] = [
  { key: 'time', label: 'Time (Brand Timezone)' },
  { key: 'queueId', label: 'Slot ID', format: 'number' },
  { key: 'collectionId', label: 'Collection ID', format: 'number' },
  { key: 'collectionTitle', label: 'Collection' },
  { key: 'collectionStatus', label: 'Collection Status' },
];

const queueSlotFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Slot ID', format: 'number' },
  { key: 'day', label: 'Day' },
  { key: 'time', label: 'Time (Brand Timezone)' },
  { key: 'date', label: 'Day and Time' },
  { key: 'status', label: 'Status' },
];

export const nuelinkOutputSchemas = {
  createCollectionPost: {
    fields: [
      { key: 'id', label: 'Post ID', format: 'number' },
      { key: 'message', label: 'Message' },
      { key: 'brandId', label: 'Brand ID' },
      { key: 'collectionId', label: 'Collection ID' },
      { key: 'publishMode', label: 'Publish Mode' },
      { key: 'scheduledAt', label: 'Scheduled For (Brand Time)', description: 'The brand-local time sent to Nuelink; empty unless Publish Mode is Schedule.' },
      { key: 'scheduledAtUtc', label: 'Scheduled For (UTC)', format: 'datetime' },
      { key: 'brandTimezone', label: 'Brand Timezone' },
    ],
  },
  updatePost: { fields: postFields },
  deletePost: {
    fields: [
      { key: 'id', label: 'Deleted Post ID', format: 'number' },
      { key: 'message', label: 'Message' },
    ],
  },
  listPosts: {
    fields: [{ key: 'items', label: 'Posts', labelKey: 'id', listItems: postFields }, ...pagingFields],
  },
  listPublishedPosts: {
    fields: [{ key: 'items', label: 'Published Results', labelKey: 'status', listItems: publishedPostFields }, ...pagingFields],
  },
  uploadMedia: {
    fields: [
      { key: 'id', label: 'Media ID' },
      { key: 'type', label: 'MIME Type' },
      { key: 'size', label: 'Size', format: 'filesize' },
    ],
  },
  listBrands: {
    fields: [{ key: 'items', label: 'Brands', labelKey: 'title', listItems: brandFields }, ...pagingFields],
  },
  listCollections: {
    fields: [{ key: 'items', label: 'Collections', labelKey: 'title', listItems: [...collectionFields, evergreenIntervalField, collectionPostCountsField] }, ...pagingFields],
  },
  newPublishedPost: { fields: publishedPostFields },
  profile: {
    fields: [
      { key: 'id', label: 'User ID' },
      { key: 'name', label: 'Name' },
      { key: 'joinedAt', label: 'Joined At', format: 'datetime' },
      { key: 'timezone', label: 'User Timezone', description: 'May be empty or an internal ID; not used for scheduling.' },
    ],
  },
  schedule: {
    fields: [
      { key: 'timezone', label: 'Brand Timezone', description: 'May be an offset such as +03:00.' },
      { key: 'queueStatus', label: 'Queue Status' },
      {
        key: 'schedule',
        label: 'Weekly Slots',
        children: WEEKDAYS.map(([key, label]) => ({ key, label, labelKey: 'time', listItems: scheduleSlotFields })),
      },
    ],
  },
  collection: { fields: [...collectionFields, evergreenIntervalField] },
  queueSlot: { fields: queueSlotFields },
  deletedQueueSlot: {
    fields: [
      { key: 'collectionId', label: 'Collection ID', format: 'number' },
      { key: 'queueId', label: 'Deleted Slot ID', format: 'number' },
    ],
  },
  automation: { fields: automationFields },
  listAutomations: {
    fields: [{ key: 'items', label: 'Automations', labelKey: 'name', listItems: automationFields }, ...pagingFields],
  },
  automationStatus: {
    fields: [
      { key: 'id', label: 'Automation ID', format: 'number' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status', description: 'ACTIVE, or INACTIVE when paused.' },
    ],
  },
  listChannels: {
    fields: [
      {
        key: 'items',
        label: 'Channels',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Channel ID', format: 'number' },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
          { key: 'type', label: 'Platform' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      ...pagingFields,
    ],
  },
  collectionChannel: {
    fields: [
      { key: 'collectionId', label: 'Collection ID', format: 'number' },
      { key: 'channelId', label: 'Channel ID', format: 'number' },
    ],
  },
  movePosts: {
    fields: [
      { key: 'moved', label: 'Posts Moved', format: 'number' },
      { key: 'sourceCollectionId', label: 'Source Collection ID', format: 'number' },
      { key: 'destinationCollectionId', label: 'Destination Collection ID', format: 'number' },
      { key: 'message', label: 'Message' },
    ],
  },
  listMedia: {
    fields: [
      {
        key: 'items',
        label: 'Media',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Media ID' },
          { key: 'name', label: 'File Name' },
          { key: 'type', label: 'MIME Type' },
          { key: 'size', label: 'Size', format: 'filesize' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      ...pagingFields,
    ],
  },
} satisfies Record<string, OutputSchema>;
