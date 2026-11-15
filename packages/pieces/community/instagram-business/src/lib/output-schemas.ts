import { OutputSchema } from '@activepieces/pieces-framework';

const mediaFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Media ID' },
  { key: 'caption', label: 'Caption' },
  {
    key: 'media_type',
    label: 'Media Type',
    description: 'IMAGE, VIDEO or CAROUSEL_ALBUM.',
  },
  {
    key: 'media_product_type',
    label: 'Product Type',
    description: 'FEED, REELS or STORY.',
  },
  { key: 'media_url', label: 'Media URL', format: 'image' },
  {
    key: 'thumbnail_url',
    label: 'Thumbnail URL',
    description: 'Videos and reels only.',
    format: 'image',
  },
  { key: 'permalink', label: 'Permalink', format: 'url' },
  { key: 'timestamp', label: 'Published At', format: 'datetime' },
  { key: 'username', label: 'Username' },
  { key: 'like_count', label: 'Likes', format: 'number' },
  { key: 'comments_count', label: 'Comments', format: 'number' },
  {
    key: 'is_comment_enabled',
    label: 'Comments Enabled',
    format: 'boolean',
  },
];

const storyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Story ID' },
  { key: 'media_type', label: 'Media Type', description: 'IMAGE or VIDEO.' },
  { key: 'media_url', label: 'Media URL', format: 'image' },
  {
    key: 'thumbnail_url',
    label: 'Thumbnail URL',
    description: 'Video stories only.',
    format: 'image',
  },
  { key: 'permalink', label: 'Permalink', format: 'url' },
  { key: 'timestamp', label: 'Published At', format: 'datetime' },
];

export const publishedMediaOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'id',
      label: 'Media ID',
      description: 'The id of the published post, usable with Get Media.',
    },
  ],
};

export const getProfileOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Instagram Account ID' },
    { key: 'username', label: 'Username' },
    { key: 'name', label: 'Display Name' },
    { key: 'biography', label: 'Biography' },
    { key: 'website', label: 'Website', format: 'url' },
    {
      key: 'profile_picture_url',
      label: 'Profile Picture',
      format: 'image',
    },
    { key: 'followers_count', label: 'Followers', format: 'number' },
    { key: 'follows_count', label: 'Following', format: 'number' },
    { key: 'media_count', label: 'Media Count', format: 'number' },
  ],
};

export const listMediaOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'media',
      label: 'Media',
      labelKey: 'caption',
      listItems: mediaFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'next_cursor',
      label: 'Next Cursor',
      description: 'Pass to fetch the following page; absent on the last page.',
    },
  ],
};

export const getMediaOutputSchema: OutputSchema = {
  fields: mediaFields,
};

export const listCarouselChildrenOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'children',
      label: 'Children',
      labelKey: 'media_type',
      listItems: [
        { key: 'id', label: 'Media ID' },
        { key: 'media_type', label: 'Media Type' },
        { key: 'media_url', label: 'Media URL', format: 'image' },
        { key: 'thumbnail_url', label: 'Thumbnail URL', format: 'image' },
        { key: 'permalink', label: 'Permalink', format: 'url' },
        { key: 'timestamp', label: 'Published At', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listStoriesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'stories',
      label: 'Stories',
      labelKey: 'id',
      listItems: storyFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const getContentPublishingLimitOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'quota_usage',
      label: 'Quota Used',
      description: 'Posts published through the API in the current window.',
      format: 'number',
    },
    { key: 'quota_total', label: 'Quota Total', format: 'number' },
    { key: 'quota_remaining', label: 'Quota Remaining', format: 'number' },
    {
      key: 'quota_duration_seconds',
      label: 'Window Length (seconds)',
      description: 'Length of the rolling window, normally 86400.',
      format: 'number',
    },
  ],
};

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  { key: 'text', label: 'Text' },
  { key: 'username', label: 'Author Username' },
  { key: 'timestamp', label: 'Posted At', format: 'datetime' },
  { key: 'like_count', label: 'Likes', format: 'number' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  {
    key: 'parent_id',
    label: 'Parent Comment ID',
    description: 'Present only when this comment is a reply.',
  },
  {
    key: 'media',
    label: 'Media',
    children: [
      { key: 'id', label: 'Media ID' },
      { key: 'media_type', label: 'Media Type' },
      { key: 'permalink', label: 'Permalink', format: 'url' },
    ],
  },
];

export const identifierResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'id', label: 'ID' },
  ],
};

export const getCommentOutputSchema: OutputSchema = {
  fields: commentFields,
};

export const listCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comments',
      labelKey: 'text',
      listItems: commentFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const commentCreatedOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Comment ID' },
    { key: 'media_id', label: 'Media ID' },
    { key: 'parent_id', label: 'Parent Comment ID' },
  ],
};

export const insightsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'insights',
      label: 'Insights',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Metric ID' },
        { key: 'name', label: 'Metric' },
        { key: 'title', label: 'Title' },
        { key: 'description', label: 'Description' },
        { key: 'period', label: 'Period' },
        {
          key: 'total_value',
          label: 'Total Value',
          children: [{ key: 'value', label: 'Value', format: 'number' }],
        },
        {
          key: 'values',
          label: 'Values',
          listItems: [
            { key: 'value', label: 'Value', format: 'number' },
            { key: 'end_time', label: 'End Time', format: 'datetime' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listConversationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'conversations',
      label: 'Conversations',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Conversation ID' },
        { key: 'updated_time', label: 'Last Activity', format: 'datetime' },
        {
          key: 'participants',
          label: 'Participants',
          children: [
            {
              key: 'data',
              label: 'People',
              labelKey: 'username',
              listItems: [
                { key: 'id', label: 'User ID' },
                { key: 'username', label: 'Username' },
              ],
            },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'next_cursor', label: 'Next Cursor' },
  ],
};

export const listMessagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'messages',
      label: 'Messages',
      labelKey: 'message',
      listItems: [
        { key: 'id', label: 'Message ID' },
        {
          key: 'message',
          label: 'Text',
          description: 'Empty for attachment-only messages.',
        },
        { key: 'created_time', label: 'Sent At', format: 'datetime' },
        {
          key: 'from',
          label: 'From',
          children: [
            { key: 'id', label: 'User ID' },
            { key: 'username', label: 'Username' },
          ],
        },
        {
          key: 'to',
          label: 'To',
          children: [
            {
              key: 'data',
              label: 'Recipients',
              labelKey: 'username',
              listItems: [
                { key: 'id', label: 'User ID' },
                { key: 'username', label: 'Username' },
              ],
            },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const sendMessageOutputSchema: OutputSchema = {
  fields: [
    { key: 'message_id', label: 'Message ID' },
    { key: 'recipient_id', label: 'Recipient ID' },
  ],
};
