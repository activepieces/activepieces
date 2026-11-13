import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function f({ key, label, format }: { key: string; label: string; format?: OutputSchemaField['format'] }): OutputSchemaField {
  return format === undefined ? { key, label } : { key, label, format };
}

function page({
  label,
  labelKey,
  itemFields,
  extra = [],
}: {
  label: string;
  labelKey: string;
  itemFields: OutputSchemaField[];
  extra?: OutputSchemaField[];
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      f({ key: 'count', label: 'Items Returned', format: 'number' }),
      ...extra,
      {
        key: 'has_more',
        label: 'Has More',
        format: 'boolean',
        description: 'True when Discourse reports more results. Request the next page to get them.',
      },
    ],
  };
}

function single({ fields, extra = [] }: { fields: OutputSchemaField[]; extra?: OutputSchemaField[] }): OutputSchema {
  return { fields: [...fields, ...extra] };
}

const topicSummaryFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Topic ID', format: 'number' }),
  f({ key: 'title', label: 'Title' }),
  f({ key: 'slug', label: 'Slug' }),
  f({ key: 'url', label: 'Topic URL', format: 'url' }),
  f({ key: 'category_id', label: 'Category ID', format: 'number' }),
  f({ key: 'tags', label: 'Tags' }),
  f({ key: 'posts_count', label: 'Posts', format: 'number' }),
  f({ key: 'reply_count', label: 'Replies', format: 'number' }),
  f({ key: 'views', label: 'Views', format: 'number' }),
  f({ key: 'like_count', label: 'Likes', format: 'number' }),
  f({ key: 'excerpt', label: 'Excerpt' }),
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  f({ key: 'last_posted_at', label: 'Last Posted At', format: 'datetime' }),
  f({ key: 'bumped_at', label: 'Bumped At', format: 'datetime' }),
  f({ key: 'closed', label: 'Closed', format: 'boolean' }),
  f({ key: 'archived', label: 'Archived', format: 'boolean' }),
  f({ key: 'pinned', label: 'Pinned', format: 'boolean' }),
  f({ key: 'visible', label: 'Listed', format: 'boolean' }),
  f({ key: 'archetype', label: 'Archetype' }),
  f({ key: 'last_poster_username', label: 'Last Poster Username' }),
];

const topicFields: OutputSchemaField[] = [
  ...topicSummaryFields,
  f({ key: 'created_by_username', label: 'Created By Username' }),
  f({ key: 'participant_count', label: 'Participants', format: 'number' }),
  f({ key: 'first_post_id', label: 'First Post ID', format: 'number' }),
  f({ key: 'first_post_cooked', label: 'First Post HTML', format: 'html' }),
  f({ key: 'external_id', label: 'External ID' }),
  f({ key: 'deleted_at', label: 'Deleted At', format: 'datetime' }),
];

const postFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Post ID', format: 'number' }),
  f({ key: 'topic_id', label: 'Topic ID', format: 'number' }),
  f({ key: 'post_number', label: 'Post Number', format: 'number' }),
  f({ key: 'username', label: 'Username' }),
  f({ key: 'name', label: 'Author Name' }),
  f({ key: 'user_id', label: 'User ID', format: 'number' }),
  f({ key: 'raw', label: 'Markdown' }),
  f({ key: 'cooked', label: 'HTML', format: 'html' }),
  f({ key: 'topic_slug', label: 'Topic Slug' }),
  f({ key: 'topic_title', label: 'Topic Title' }),
  f({ key: 'url', label: 'Post URL', format: 'url' }),
  f({ key: 'reply_to_post_number', label: 'Reply To Post Number', format: 'number' }),
  f({ key: 'reply_count', label: 'Replies', format: 'number' }),
  f({ key: 'like_count', label: 'Likes', format: 'number' }),
  f({ key: 'version', label: 'Version', format: 'number' }),
  f({ key: 'hidden', label: 'Hidden', format: 'boolean' }),
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  f({ key: 'updated_at', label: 'Updated At', format: 'datetime' }),
  f({ key: 'deleted_at', label: 'Deleted At', format: 'datetime' }),
];

const userFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'User ID', format: 'number' }),
  f({ key: 'username', label: 'Username' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'title', label: 'Title' }),
  f({ key: 'avatar_url', label: 'Avatar', format: 'image' }),
  f({ key: 'trust_level', label: 'Trust Level', format: 'number' }),
  f({ key: 'admin', label: 'Admin', format: 'boolean' }),
  f({ key: 'moderator', label: 'Moderator', format: 'boolean' }),
  f({ key: 'active', label: 'Active', format: 'boolean' }),
  f({ key: 'staged', label: 'Staged', format: 'boolean' }),
  f({ key: 'suspended_till', label: 'Suspended Until', format: 'datetime' }),
  f({ key: 'silenced_till', label: 'Silenced Until', format: 'datetime' }),
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  f({ key: 'last_seen_at', label: 'Last Seen At', format: 'datetime' }),
  f({ key: 'last_posted_at', label: 'Last Posted At', format: 'datetime' }),
  f({ key: 'post_count', label: 'Posts', format: 'number' }),
  f({ key: 'badge_count', label: 'Badges', format: 'number' }),
  f({ key: 'location', label: 'Location' }),
  f({ key: 'website', label: 'Website', format: 'url' }),
  f({ key: 'bio_raw', label: 'Bio' }),
];

const adminUserFields: OutputSchemaField[] = [
  ...userFields,
  f({ key: 'email', label: 'Email', format: 'email' }),
  f({ key: 'approved', label: 'Approved', format: 'boolean' }),
  f({ key: 'ip_address', label: 'IP Address' }),
  f({ key: 'external_id', label: 'SSO External ID' }),
];

const categoryFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Category ID', format: 'number' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'slug', label: 'Slug' }),
  f({ key: 'url', label: 'Category URL', format: 'url' }),
  f({ key: 'color', label: 'Color' }),
  f({ key: 'text_color', label: 'Text Color' }),
  f({ key: 'description', label: 'Description' }),
  f({ key: 'parent_category_id', label: 'Parent Category ID', format: 'number' }),
  f({ key: 'topic_count', label: 'Topics', format: 'number' }),
  f({ key: 'post_count', label: 'Posts', format: 'number' }),
  f({ key: 'position', label: 'Position', format: 'number' }),
  f({ key: 'read_restricted', label: 'Restricted', format: 'boolean' }),
];

const groupFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Group ID', format: 'number' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'full_name', label: 'Full Name' }),
  f({ key: 'display_name', label: 'Display Name' }),
  f({ key: 'user_count', label: 'Members', format: 'number' }),
  f({ key: 'automatic', label: 'Automatic', format: 'boolean' }),
  f({ key: 'visibility_level', label: 'Visibility Level', format: 'number' }),
  f({ key: 'mentionable_level', label: 'Mentionable Level', format: 'number' }),
  f({ key: 'messageable_level', label: 'Messageable Level', format: 'number' }),
  f({ key: 'title', label: 'Title' }),
  f({ key: 'bio_raw', label: 'Bio' }),
  f({ key: 'public_admission', label: 'Anyone Can Join', format: 'boolean' }),
  f({ key: 'allow_membership_requests', label: 'Allows Membership Requests', format: 'boolean' }),
];

const groupMemberFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'User ID', format: 'number' }),
  f({ key: 'username', label: 'Username' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'title', label: 'Title' }),
  f({ key: 'avatar_url', label: 'Avatar', format: 'image' }),
  f({ key: 'is_owner', label: 'Is Owner', format: 'boolean' }),
  f({ key: 'added_at', label: 'Added At', format: 'datetime' }),
  f({ key: 'last_seen_at', label: 'Last Seen At', format: 'datetime' }),
  f({ key: 'last_posted_at', label: 'Last Posted At', format: 'datetime' }),
];

const badgeFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Badge ID', format: 'number' }),
  f({ key: 'name', label: 'Name' }),
  f({ key: 'description', label: 'Description' }),
  f({ key: 'badge_type_id', label: 'Badge Type ID', format: 'number' }),
  f({ key: 'grant_count', label: 'Times Granted', format: 'number' }),
  f({ key: 'enabled', label: 'Enabled', format: 'boolean' }),
  f({ key: 'multiple_grant', label: 'Can Be Granted Multiple Times', format: 'boolean' }),
  f({ key: 'allow_title', label: 'Usable As Title', format: 'boolean' }),
  f({ key: 'icon', label: 'Icon' }),
  f({ key: 'image_url', label: 'Image', format: 'image' }),
];

const userBadgeFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'User Badge ID', format: 'number' }),
  f({ key: 'badge_id', label: 'Badge ID', format: 'number' }),
  f({ key: 'badge_name', label: 'Badge Name' }),
  f({ key: 'granted_at', label: 'Granted At', format: 'datetime' }),
  f({ key: 'granted_by_id', label: 'Granted By User ID', format: 'number' }),
  f({ key: 'post_id', label: 'Post ID', format: 'number' }),
  f({ key: 'topic_id', label: 'Topic ID', format: 'number' }),
];

const notificationFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Notification ID', format: 'number' }),
  f({ key: 'notification_type', label: 'Notification Type', format: 'number' }),
  f({ key: 'read', label: 'Read', format: 'boolean' }),
  f({ key: 'high_priority', label: 'High Priority', format: 'boolean' }),
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  f({ key: 'topic_id', label: 'Topic ID', format: 'number' }),
  f({ key: 'post_number', label: 'Post Number', format: 'number' }),
  f({ key: 'slug', label: 'Topic Slug' }),
  f({ key: 'topic_title', label: 'Topic Title' }),
  f({ key: 'display_username', label: 'From Username' }),
];

const userActionFields: OutputSchemaField[] = [
  f({ key: 'action_type', label: 'Action Type', format: 'number' }),
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  f({ key: 'topic_id', label: 'Topic ID', format: 'number' }),
  f({ key: 'post_id', label: 'Post ID', format: 'number' }),
  f({ key: 'post_number', label: 'Post Number', format: 'number' }),
  f({ key: 'title', label: 'Topic Title' }),
  f({ key: 'excerpt', label: 'Excerpt' }),
  f({ key: 'username', label: 'Username' }),
  f({ key: 'acting_username', label: 'Acting Username' }),
  f({ key: 'category_id', label: 'Category ID', format: 'number' }),
  f({ key: 'slug', label: 'Topic Slug' }),
];

const inviteFields: OutputSchemaField[] = [
  f({ key: 'id', label: 'Invite ID', format: 'number' }),
  f({ key: 'invite_key', label: 'Invite Key' }),
  f({ key: 'link', label: 'Invite Link', format: 'url' }),
  f({ key: 'email', label: 'Email', format: 'email' }),
  f({ key: 'domain', label: 'Allowed Domain' }),
  f({ key: 'emailed', label: 'Email Sent', format: 'boolean' }),
  f({ key: 'max_redemptions_allowed', label: 'Max Redemptions', format: 'number' }),
  f({ key: 'redemption_count', label: 'Redemptions', format: 'number' }),
  f({ key: 'expires_at', label: 'Expires At', format: 'datetime' }),
  f({ key: 'created_at', label: 'Created At', format: 'datetime' }),
];

const tagFields: OutputSchemaField[] = [f({ key: 'id', label: 'Tag ID' }), f({ key: 'name', label: 'Name' }), f({ key: 'count', label: 'Topics', format: 'number' })];

const successFields: OutputSchemaField[] = [f({ key: 'success', label: 'Success', format: 'boolean' })];

export const discourseSchemas = {
  topic: single({ fields: topicFields }),
  topicPage: page({
    label: 'Topics',
    labelKey: 'title',
    itemFields: topicSummaryFields,
    extra: [f({ key: 'page', label: 'Page', format: 'number' }), f({ key: 'next_page', label: 'Next Page', format: 'number' })],
  }),
  topicPosts: page({
    label: 'Posts',
    labelKey: 'post_number',
    itemFields: postFields,
    extra: [f({ key: 'topic_id', label: 'Topic ID', format: 'number' }), f({ key: 'total_posts', label: 'Total Posts', format: 'number' }), f({ key: 'offset', label: 'Offset', format: 'number' }), f({ key: 'next_offset', label: 'Next Offset', format: 'number' })],
  }),
  topicUpdate: single({ fields: [f({ key: 'topic_id', label: 'Topic ID', format: 'number' }), f({ key: 'title', label: 'Title' }), f({ key: 'slug', label: 'Slug' }), f({ key: 'category_id', label: 'Category ID', format: 'number' }), f({ key: 'url', label: 'Topic URL', format: 'url' })] }),
  topicStatus: single({ fields: [f({ key: 'topic_id', label: 'Topic ID', format: 'number' }), f({ key: 'status', label: 'Status' }), f({ key: 'enabled', label: 'Enabled', format: 'boolean' }), f({ key: 'until', label: 'Until', format: 'datetime' })] }),
  deleted: single({ fields: [f({ key: 'id', label: 'ID', format: 'number' }), f({ key: 'deleted', label: 'Deleted', format: 'boolean' }), f({ key: 'already_deleted', label: 'Was Already Deleted', format: 'boolean' })] }),
  post: single({ fields: postFields }),
  createdPost: single({ fields: postFields, extra: [f({ key: 'topic_url', label: 'Topic URL', format: 'url' })] }),
  createdTopic: single({ fields: postFields, extra: [f({ key: 'topic_url', label: 'Topic URL', format: 'url' }), f({ key: 'already_existed', label: 'Already Existed', format: 'boolean' })] }),
  postPage: page({
    label: 'Posts',
    labelKey: 'id',
    itemFields: postFields,
    extra: [f({ key: 'next_before', label: 'Next Before Post ID', format: 'number' })],
  }),
  postList: page({ label: 'Posts', labelKey: 'id', itemFields: postFields }),
  like: single({ fields: [f({ key: 'post_id', label: 'Post ID', format: 'number' }), f({ key: 'liked', label: 'Liked', format: 'boolean' }), f({ key: 'already_liked', label: 'Was Already Liked', format: 'boolean' }), f({ key: 'like_count', label: 'Likes', format: 'number' })] }),
  search: single({ fields: [
    { key: 'topics', label: 'Topics', labelKey: 'title', listItems: topicSummaryFields },
    { key: 'posts', label: 'Posts', labelKey: 'id', listItems: [f({ key: 'id', label: 'Post ID', format: 'number' }), f({ key: 'topic_id', label: 'Topic ID', format: 'number' }), f({ key: 'post_number', label: 'Post Number', format: 'number' }), f({ key: 'username', label: 'Username' }), f({ key: 'blurb', label: 'Blurb' }), f({ key: 'like_count', label: 'Likes', format: 'number' }), f({ key: 'created_at', label: 'Created At', format: 'datetime' })] },
    { key: 'users', label: 'Users', labelKey: 'username', listItems: [f({ key: 'id', label: 'User ID', format: 'number' }), f({ key: 'username', label: 'Username' }), f({ key: 'name', label: 'Name' })] },
    { key: 'categories', label: 'Categories', labelKey: 'name', listItems: [f({ key: 'id', label: 'Category ID', format: 'number' }), f({ key: 'name', label: 'Name' }), f({ key: 'slug', label: 'Slug' })] },
    f({ key: 'page', label: 'Page', format: 'number' }),
    f({ key: 'has_more', label: 'Has More', format: 'boolean' }),
  ] }),
  category: single({ fields: categoryFields }),
  categoryList: page({ label: 'Categories', labelKey: 'name', itemFields: categoryFields }),
  tagList: page({ label: 'Tags', labelKey: 'name', itemFields: tagFields }),
  user: single({ fields: userFields }),
  adminUser: single({ fields: adminUserFields }),
  userList: page({
    label: 'Users',
    labelKey: 'username',
    itemFields: adminUserFields,
    extra: [f({ key: 'page', label: 'Page', format: 'number' }), f({ key: 'next_page', label: 'Next Page', format: 'number' })],
  }),
  createdUser: single({ fields: [f({ key: 'success', label: 'Success', format: 'boolean' }), f({ key: 'active', label: 'Active', format: 'boolean' }), f({ key: 'user_id', label: 'User ID', format: 'number' }), f({ key: 'message', label: 'Message' })] }),
  userUpdate: single({ fields: userFields, extra: [f({ key: 'success', label: 'Success', format: 'boolean' })] }),
  trustLevel: single({ fields: [f({ key: 'user_id', label: 'User ID', format: 'number' }), f({ key: 'trust_level', label: 'Trust Level', format: 'number' }), f({ key: 'username', label: 'Username' })] }),
  moderation: single({ fields: [f({ key: 'user_id', label: 'User ID', format: 'number' }), f({ key: 'action', label: 'Action' }), f({ key: 'success', label: 'Success', format: 'boolean' }), f({ key: 'until', label: 'Until', format: 'datetime' }), f({ key: 'reason', label: 'Reason' })] }),
  userActions: page({
    label: 'Actions',
    labelKey: 'title',
    itemFields: userActionFields,
    extra: [f({ key: 'offset', label: 'Offset', format: 'number' }), f({ key: 'next_offset', label: 'Next Offset', format: 'number' })],
  }),
  group: single({ fields: groupFields }),
  groupList: page({
    label: 'Groups',
    labelKey: 'name',
    itemFields: groupFields,
    extra: [f({ key: 'total', label: 'Total Groups', format: 'number' }), f({ key: 'page', label: 'Page', format: 'number' }), f({ key: 'next_page', label: 'Next Page', format: 'number' })],
  }),
  groupMembers: page({
    label: 'Members',
    labelKey: 'username',
    itemFields: groupMemberFields,
    extra: [f({ key: 'total', label: 'Total Members', format: 'number' }), f({ key: 'offset', label: 'Offset', format: 'number' }), f({ key: 'next_offset', label: 'Next Offset', format: 'number' })],
  }),
  groupMembership: single({ fields: [
    f({ key: 'group_id', label: 'Group ID', format: 'number' }),
    f({ key: 'success', label: 'Success', format: 'boolean' }),
    f({ key: 'usernames', label: 'Usernames Changed' }),
    f({ key: 'skipped_usernames', label: 'Usernames Skipped' }),
    f({ key: 'emails', label: 'Emails Changed' }),
  ] }),
  createdGroup: single({ fields: groupFields }),
  invite: single({ fields: inviteFields }),
  topicInvite: single({ fields: [f({ key: 'topic_id', label: 'Topic ID', format: 'number' }), f({ key: 'success', label: 'Success', format: 'boolean' }), f({ key: 'invited', label: 'Invited' }), f({ key: 'user_id', label: 'User ID', format: 'number' }), f({ key: 'username', label: 'Username' })] }),
  grantedBadge: single({ fields: userBadgeFields, extra: [f({ key: 'username', label: 'Username' })] }),
  badgeList: page({ label: 'Badges', labelKey: 'name', itemFields: badgeFields }),
  userBadges: page({ label: 'Badges', labelKey: 'badge_name', itemFields: userBadgeFields }),
  notifications: page({
    label: 'Notifications',
    labelKey: 'topic_title',
    itemFields: notificationFields,
    extra: [f({ key: 'total', label: 'Total Notifications', format: 'number' }), f({ key: 'offset', label: 'Offset', format: 'number' }), f({ key: 'next_offset', label: 'Next Offset', format: 'number' })],
  }),
  siteInfo: single({ fields: [
    f({ key: 'title', label: 'Title' }),
    f({ key: 'description', label: 'Description' }),
    f({ key: 'logo_url', label: 'Logo', format: 'image' }),
    f({ key: 'mobile_logo_url', label: 'Mobile Logo', format: 'image' }),
    f({ key: 'default_locale', label: 'Default Locale' }),
    f({ key: 'login_required', label: 'Login Required', format: 'boolean' }),
    f({ key: 'locale', label: 'Locale' }),
    f({ key: 'include_in_discourse_discover', label: 'Listed In Discourse Discover', format: 'boolean' }),
    f({ key: 'url', label: 'Forum URL', format: 'url' }),
  ] }),
  success: single({ fields: successFields }),
  webhookTopic: single({ fields: topicSummaryFields, extra: [f({ key: 'event', label: 'Event' }), f({ key: 'event_id', label: 'Delivery ID' }), f({ key: 'user_id', label: 'Author User ID', format: 'number' })] }),
  webhookPost: single({ fields: postFields, extra: [f({ key: 'event', label: 'Event' }), f({ key: 'event_id', label: 'Delivery ID' })] }),
  webhookUser: single({ fields: userFields, extra: [f({ key: 'event', label: 'Event' }), f({ key: 'event_id', label: 'Delivery ID' })] }),
  webhookGroupUser: single({ fields: [
    f({ key: 'event', label: 'Event' }),
    f({ key: 'event_id', label: 'Delivery ID' }),
    f({ key: 'group_id', label: 'Group ID', format: 'number' }),
    f({ key: 'user_id', label: 'User ID', format: 'number' }),
    f({ key: 'owner', label: 'Owner', format: 'boolean' }),
    f({ key: 'created_at', label: 'Added At', format: 'datetime' }),
  ] }),
};
