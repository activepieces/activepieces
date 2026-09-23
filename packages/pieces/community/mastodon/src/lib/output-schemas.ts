import { OutputSchema } from '@activepieces/pieces-framework';

const accountSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Account ID' },
  { key: 'username', label: 'Username' },
  { key: 'acct', label: 'Handle' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'url', label: 'Profile URL', format: 'url' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'bot', label: 'Bot', format: 'boolean' },
];

const accountFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Account ID' },
  { key: 'username', label: 'Username' },
  { key: 'acct', label: 'Handle' },
  { key: 'display_name', label: 'Display Name' },
  { key: 'note', label: 'Bio', format: 'html' },
  { key: 'url', label: 'Profile URL', format: 'url' },
  { key: 'uri', label: 'ActivityPub URI', format: 'url' },
  { key: 'avatar', label: 'Avatar', format: 'image' },
  { key: 'header', label: 'Header Image', format: 'image' },
  { key: 'locked', label: 'Requires Follow Approval', format: 'boolean' },
  { key: 'bot', label: 'Bot', format: 'boolean' },
  { key: 'group', label: 'Group', format: 'boolean' },
  { key: 'discoverable', label: 'Discoverable', format: 'boolean' },
  { key: 'indexable', label: 'Indexable', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'last_status_at', label: 'Last Status Date', format: 'date' },
  { key: 'followers_count', label: 'Followers', format: 'number' },
  { key: 'following_count', label: 'Following', format: 'number' },
  { key: 'statuses_count', label: 'Statuses', format: 'number' },
  {
    key: 'fields',
    label: 'Profile Fields',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'value', label: 'Value', format: 'html' },
      { key: 'verified_at', label: 'Verified At', format: 'datetime' },
    ],
  },
];

const myAccountFields: OutputSchema['fields'] = [
  ...accountFields,
  {
    key: 'source',
    label: 'Posting Defaults',
    children: [
      { key: 'privacy', label: 'Default Visibility' },
      { key: 'sensitive', label: 'Mark Media Sensitive by Default', format: 'boolean' },
      { key: 'language', label: 'Default Language' },
      { key: 'note', label: 'Bio (Plain Text)' },
      { key: 'follow_requests_count', label: 'Pending Follow Requests', format: 'number' },
    ],
  },
];

const mediaAttachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Media ID' },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'preview_url', label: 'Preview', format: 'image' },
  { key: 'remote_url', label: 'Remote URL', format: 'url' },
  { key: 'description', label: 'Alt Text' },
  {
    key: 'meta',
    label: 'Metadata',
    children: [
      {
        key: 'original',
        label: 'Original',
        children: [
          { key: 'width', label: 'Width', format: 'number' },
          { key: 'height', label: 'Height', format: 'number' },
        ],
      },
      {
        key: 'focus',
        label: 'Focal Point',
        children: [
          { key: 'x', label: 'X', format: 'number' },
          { key: 'y', label: 'Y', format: 'number' },
        ],
      },
    ],
  },
];

const mappedMediaFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Media ID' },
  { key: 'type', label: 'Type' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'preview_url', label: 'Preview', format: 'image' },
  { key: 'description', label: 'Alt Text' },
  { key: 'processing', label: 'Still Processing', format: 'boolean' },
];

const pollFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Poll ID' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  { key: 'expired', label: 'Expired', format: 'boolean' },
  { key: 'multiple', label: 'Multiple Choice', format: 'boolean' },
  { key: 'votes_count', label: 'Votes', format: 'number' },
  { key: 'voters_count', label: 'Voters', format: 'number' },
  { key: 'voted', label: 'Voted', format: 'boolean' },
  { key: 'own_votes', label: 'Own Votes (Option Indexes)' },
  {
    key: 'options',
    label: 'Options',
    labelKey: 'title',
    listItems: [
      { key: 'title', label: 'Title' },
      { key: 'votes_count', label: 'Votes', format: 'number' },
    ],
  },
];

const previewCardFields: OutputSchema['fields'] = [
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'language', label: 'Language' },
  { key: 'provider_name', label: 'Provider' },
  { key: 'author_name', label: 'Author' },
  { key: 'image', label: 'Image', format: 'image' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
];

const usageHistoryFields: OutputSchema['fields'] = [
  {
    key: 'history',
    label: 'Daily Usage',
    labelKey: 'day',
    listItems: [
      { key: 'day', label: 'Day (Unix Time)' },
      { key: 'uses', label: 'Uses' },
      { key: 'accounts', label: 'Accounts' },
    ],
  },
];

const statusCoreFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Status ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'uri', label: 'ActivityPub URI', format: 'url' },
  { key: 'content', label: 'Content', format: 'html' },
  { key: 'spoiler_text', label: 'Content Warning' },
  { key: 'sensitive', label: 'Sensitive', format: 'boolean' },
  { key: 'visibility', label: 'Visibility' },
  { key: 'language', label: 'Language' },
  { key: 'in_reply_to_id', label: 'In Reply To Status ID' },
  { key: 'in_reply_to_account_id', label: 'In Reply To Account ID' },
  { key: 'replies_count', label: 'Replies', format: 'number' },
  { key: 'reblogs_count', label: 'Boosts', format: 'number' },
  { key: 'favourites_count', label: 'Favourites', format: 'number' },
  { key: 'edited_at', label: 'Edited At', format: 'datetime' },
  { key: 'account', label: 'Author', children: accountSummaryFields },
  {
    key: 'media_attachments',
    label: 'Media Attachments',
    labelKey: 'type',
    listItems: mediaAttachmentFields,
  },
  {
    key: 'mentions',
    label: 'Mentions',
    labelKey: 'acct',
    listItems: [
      { key: 'id', label: 'Account ID' },
      { key: 'username', label: 'Username' },
      { key: 'acct', label: 'Handle' },
      { key: 'url', label: 'Profile URL', format: 'url' },
    ],
  },
  {
    key: 'tags',
    label: 'Hashtags',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'url', label: 'URL', format: 'url' },
    ],
  },
  { key: 'poll', label: 'Poll', children: pollFields },
  { key: 'card', label: 'Link Preview', children: previewCardFields },
];

const statusFields: OutputSchema['fields'] = [
  ...statusCoreFields,
  { key: 'favourited', label: 'Favourited by Me', format: 'boolean' },
  { key: 'reblogged', label: 'Boosted by Me', format: 'boolean' },
  { key: 'bookmarked', label: 'Bookmarked by Me', format: 'boolean' },
  { key: 'muted', label: 'Conversation Muted', format: 'boolean' },
  { key: 'pinned', label: 'Pinned to Profile', format: 'boolean' },
  { key: 'reblog', label: 'Boosted Status', children: statusCoreFields },
  {
    key: 'application',
    label: 'Posted With',
    children: [
      { key: 'name', label: 'App Name' },
      { key: 'website', label: 'App Website', format: 'url' },
    ],
  },
];

const deletedStatusFields: OutputSchema['fields'] = [
  ...statusFields.filter((field) => field.key !== 'content'),
  { key: 'text', label: 'Source Text (for Redraft)' },
];

const tagFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Tag ID' },
  { key: 'name', label: 'Name' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'following', label: 'Followed by Me', format: 'boolean' },
  { key: 'featuring', label: 'Featured on Profile', format: 'boolean' },
  ...usageHistoryFields,
];

const trendingLinkFields: OutputSchema['fields'] = [...previewCardFields, ...usageHistoryFields];

const listFields: OutputSchema['fields'] = [
  { key: 'id', label: 'List ID' },
  { key: 'title', label: 'Title' },
  { key: 'replies_policy', label: 'Replies Policy' },
  { key: 'exclusive', label: 'Exclusive', format: 'boolean' },
];

const filterFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Filter ID' },
  { key: 'title', label: 'Title' },
  { key: 'context', label: 'Contexts' },
  { key: 'filter_action', label: 'Action' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  {
    key: 'keywords',
    label: 'Keywords',
    labelKey: 'keyword',
    listItems: [
      { key: 'id', label: 'Keyword ID' },
      { key: 'keyword', label: 'Keyword' },
      { key: 'whole_word', label: 'Whole Word', format: 'boolean' },
    ],
  },
];

const scheduledStatusFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Scheduled Status ID' },
  { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
  {
    key: 'params',
    label: 'Status Parameters',
    children: [
      { key: 'text', label: 'Text' },
      { key: 'visibility', label: 'Visibility' },
      { key: 'spoiler_text', label: 'Content Warning' },
      { key: 'sensitive', label: 'Sensitive', format: 'boolean' },
      { key: 'language', label: 'Language' },
      { key: 'in_reply_to_id', label: 'In Reply To Status ID' },
      { key: 'media_ids', label: 'Media IDs' },
    ],
  },
  {
    key: 'media_attachments',
    label: 'Media Attachments',
    labelKey: 'type',
    listItems: mediaAttachmentFields,
  },
];

const instanceFields: OutputSchema['fields'] = [
  { key: 'domain', label: 'Domain' },
  { key: 'title', label: 'Title' },
  { key: 'version', label: 'Mastodon Version' },
  { key: 'description', label: 'Description' },
  { key: 'source_url', label: 'Source Code URL', format: 'url' },
  { key: 'languages', label: 'Languages' },
  {
    key: 'usage',
    label: 'Usage',
    children: [
      {
        key: 'users',
        label: 'Users',
        children: [{ key: 'active_month', label: 'Monthly Active Users', format: 'number' }],
      },
    ],
  },
  {
    key: 'thumbnail',
    label: 'Thumbnail',
    children: [{ key: 'url', label: 'URL', format: 'image' }],
  },
  {
    key: 'configuration',
    label: 'Configuration',
    children: [
      {
        key: 'statuses',
        label: 'Statuses',
        children: [
          { key: 'max_characters', label: 'Max Characters', format: 'number' },
          { key: 'max_media_attachments', label: 'Max Media Attachments', format: 'number' },
          { key: 'characters_reserved_per_url', label: 'Characters per URL', format: 'number' },
        ],
      },
      {
        key: 'media_attachments',
        label: 'Media Attachments',
        children: [
          { key: 'image_size_limit', label: 'Image Size Limit', format: 'filesize' },
          { key: 'video_size_limit', label: 'Video Size Limit', format: 'filesize' },
          { key: 'description_limit', label: 'Alt Text Limit', format: 'number' },
          { key: 'supported_mime_types', label: 'Supported MIME Types' },
        ],
      },
      {
        key: 'polls',
        label: 'Polls',
        children: [
          { key: 'max_options', label: 'Max Options', format: 'number' },
          { key: 'max_characters_per_option', label: 'Max Characters per Option', format: 'number' },
          { key: 'min_expiration', label: 'Min Duration (Seconds)', format: 'number' },
          { key: 'max_expiration', label: 'Max Duration (Seconds)', format: 'number' },
        ],
      },
      {
        key: 'translation',
        label: 'Translation',
        children: [{ key: 'enabled', label: 'Enabled', format: 'boolean' }],
      },
    ],
  },
  {
    key: 'registrations',
    label: 'Registrations',
    children: [
      { key: 'enabled', label: 'Open', format: 'boolean' },
      { key: 'approval_required', label: 'Approval Required', format: 'boolean' },
      { key: 'min_age', label: 'Minimum Age', format: 'number' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    children: [
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'account', label: 'Account', children: accountSummaryFields },
    ],
  },
  {
    key: 'rules',
    label: 'Rules',
    labelKey: 'text',
    listItems: [
      { key: 'id', label: 'Rule ID' },
      { key: 'text', label: 'Text' },
      { key: 'hint', label: 'Hint' },
    ],
  },
];

const relationshipFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Account ID' },
  { key: 'following', label: 'Following', format: 'boolean' },
  { key: 'followed_by', label: 'Follows You', format: 'boolean' },
  { key: 'requested', label: 'Follow Request Pending', format: 'boolean' },
  { key: 'requested_by', label: 'Has Requested to Follow You', format: 'boolean' },
  { key: 'showing_reblogs', label: 'Showing Their Boosts', format: 'boolean' },
  { key: 'notifying', label: 'Notified of Their Posts', format: 'boolean' },
  { key: 'languages', label: 'Language Filter' },
  { key: 'blocking', label: 'Blocking', format: 'boolean' },
  { key: 'blocked_by', label: 'Blocked by Them', format: 'boolean' },
  { key: 'muting', label: 'Muting', format: 'boolean' },
  { key: 'muting_notifications', label: 'Muting Their Notifications', format: 'boolean' },
  { key: 'muting_expires_at', label: 'Mute Expires At', format: 'datetime' },
  { key: 'domain_blocking', label: 'Blocking Their Domain', format: 'boolean' },
  { key: 'endorsed', label: 'Featured on Profile', format: 'boolean' },
  { key: 'note', label: 'Private Note' },
];

const mutedAccountFields: OutputSchema['fields'] = [
  ...accountFields,
  { key: 'mute_expires_at', label: 'Mute Expires At', format: 'datetime' },
];

const notificationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Notification ID' },
  { key: 'type', label: 'Type' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'group_key', label: 'Group Key' },
  { key: 'account', label: 'From Account', children: accountSummaryFields },
  { key: 'status', label: 'Related Status', children: statusFields },
];

const conversationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Conversation ID' },
  { key: 'unread', label: 'Unread', format: 'boolean' },
  {
    key: 'accounts',
    label: 'Participants',
    labelKey: 'acct',
    listItems: accountSummaryFields,
  },
  { key: 'last_status', label: 'Last Status', children: statusFields },
];

const acknowledgementFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
];

function pageSchema({
  itemsKey,
  label,
  items,
  labelKey,
}: {
  itemsKey: string;
  label: string;
  items: OutputSchema['fields'];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: itemsKey, label, labelKey, listItems: items },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'next_max_id', label: 'Next Page Cursor (max_id)' },
      { key: 'prev_min_id', label: 'Previous Page Cursor (min_id)' },
      { key: 'prev_since_id', label: 'Previous Page Cursor (since_id)' },
    ],
  };
}

function countedListSchema({
  itemsKey,
  label,
  items,
  labelKey,
}: {
  itemsKey: string;
  label: string;
  items: OutputSchema['fields'];
  labelKey: string;
}): OutputSchema {
  return {
    fields: [
      { key: itemsKey, label, labelKey, listItems: items },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  };
}

function acknowledgementSchema({ idKey, idLabel }: { idKey: string; idLabel: string }): OutputSchema {
  return {
    fields: [...acknowledgementFields, { key: idKey, label: idLabel }],
  };
}

export const statusOutputSchema: OutputSchema = { fields: statusFields };

export const deletedStatusOutputSchema: OutputSchema = { fields: deletedStatusFields };

export const statusContextOutputSchema: OutputSchema = {
  fields: [
    { key: 'ancestors', label: 'Ancestors', labelKey: 'url', listItems: statusFields },
    { key: 'descendants', label: 'Replies', labelKey: 'url', listItems: statusFields },
  ],
};

export const statusPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'statuses',
  label: 'Statuses',
  items: statusFields,
  labelKey: 'url',
});

export const trendingStatusesOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'statuses',
  label: 'Trending Statuses',
  items: statusFields,
  labelKey: 'url',
});

export const accountOutputSchema: OutputSchema = { fields: accountFields };

export const myAccountOutputSchema: OutputSchema = { fields: myAccountFields };

export const accountPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'accounts',
  label: 'Accounts',
  items: accountFields,
  labelKey: 'acct',
});

export const searchAccountsOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'accounts',
  label: 'Accounts',
  items: accountFields,
  labelKey: 'acct',
});

export const searchOutputSchema: OutputSchema = {
  fields: [
    { key: 'accounts', label: 'Accounts', labelKey: 'acct', listItems: accountFields },
    { key: 'statuses', label: 'Statuses', labelKey: 'url', listItems: statusFields },
    { key: 'hashtags', label: 'Hashtags', labelKey: 'name', listItems: tagFields },
  ],
};

export const scheduledStatusOutputSchema: OutputSchema = { fields: scheduledStatusFields };

export const scheduledStatusPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'scheduled_statuses',
  label: 'Scheduled Statuses',
  items: scheduledStatusFields,
  labelKey: 'scheduled_at',
});

export const mappedMediaOutputSchema: OutputSchema = { fields: mappedMediaFields };

export const mediaAttachmentOutputSchema: OutputSchema = { fields: mediaAttachmentFields };

export const pollOutputSchema: OutputSchema = { fields: pollFields };

export const tagOutputSchema: OutputSchema = { fields: tagFields };

export const tagPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'tags',
  label: 'Hashtags',
  items: tagFields,
  labelKey: 'name',
});

export const trendingTagsOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'tags',
  label: 'Trending Hashtags',
  items: tagFields,
  labelKey: 'name',
});

export const trendingLinksOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'links',
  label: 'Trending Links',
  items: trendingLinkFields,
  labelKey: 'title',
});

export const listOutputSchema: OutputSchema = { fields: listFields };

export const listsOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'lists',
  label: 'Lists',
  items: listFields,
  labelKey: 'title',
});

export const filterOutputSchema: OutputSchema = { fields: filterFields };

export const filtersOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'filters',
  label: 'Filters',
  items: filterFields,
  labelKey: 'title',
});

export const unreadNotificationCountOutputSchema: OutputSchema = {
  fields: [{ key: 'count', label: 'Unread Notifications', format: 'number' }],
};

export const instanceOutputSchema: OutputSchema = { fields: instanceFields };

export const cancelledScheduledStatusOutputSchema: OutputSchema = acknowledgementSchema({
  idKey: 'scheduled_status_id',
  idLabel: 'Cancelled Scheduled Status ID',
});

export const deletedMediaOutputSchema: OutputSchema = acknowledgementSchema({
  idKey: 'media_id',
  idLabel: 'Deleted Media ID',
});

export const deletedFilterOutputSchema: OutputSchema = acknowledgementSchema({
  idKey: 'filter_id',
  idLabel: 'Deleted Filter ID',
});

export const listAcknowledgementOutputSchema: OutputSchema = acknowledgementSchema({
  idKey: 'list_id',
  idLabel: 'List ID',
});

export const dismissedNotificationOutputSchema: OutputSchema = acknowledgementSchema({
  idKey: 'notification_id',
  idLabel: 'Dismissed Notification ID',
});

export const removedConversationOutputSchema: OutputSchema = acknowledgementSchema({
  idKey: 'conversation_id',
  idLabel: 'Removed Conversation ID',
});

export const clearedNotificationsOutputSchema: OutputSchema = { fields: acknowledgementFields };

export const relationshipOutputSchema: OutputSchema = { fields: relationshipFields };

export const relationshipsOutputSchema: OutputSchema = countedListSchema({
  itemsKey: 'relationships',
  label: 'Relationships',
  items: relationshipFields,
  labelKey: 'id',
});

export const mutedAccountPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'accounts',
  label: 'Muted Accounts',
  items: mutedAccountFields,
  labelKey: 'acct',
});

export const notificationOutputSchema: OutputSchema = { fields: notificationFields };

export const followNotificationOutputSchema: OutputSchema = {
  fields: notificationFields.filter((field) => field.key !== 'status'),
};

export const notificationPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'notifications',
  label: 'Notifications',
  items: notificationFields,
  labelKey: 'type',
});

export const conversationOutputSchema: OutputSchema = { fields: conversationFields };

export const conversationPageOutputSchema: OutputSchema = pageSchema({
  itemsKey: 'conversations',
  label: 'Conversations',
  items: conversationFields,
  labelKey: 'id',
});

export const postStatusOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'HTTP Status', format: 'number' },
    { key: 'body', label: 'Status', children: statusFields },
  ],
};
