import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function pageSchema({
  label,
  labelKey,
  itemFields,
}: {
  label: string;
  labelKey: string;
  itemFields: OutputSchemaField[];
}): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      {
        key: 'next_cursor',
        label: 'Next Cursor',
        description: 'Pass as Cursor to fetch the next page. Empty on the last page.',
      },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'total_count', label: 'Total Count', format: 'number', description: 'Total reported by Bettermode, when available.' },
    ],
  };
}

const postFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post ID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'status', label: 'Status' },
  { key: 'space_id', label: 'Space ID' },
  { key: 'space_name', label: 'Space Name' },
  { key: 'post_type_id', label: 'Post Type ID' },
  { key: 'post_type_name', label: 'Post Type Name' },
  { key: 'owner_id', label: 'Author Member ID' },
  { key: 'owner_name', label: 'Author Name' },
  { key: 'replied_to_id', label: 'Replied To Post ID', description: 'Set on replies only.' },
  { key: 'content_html', label: 'Content (HTML)', format: 'html' },
  { key: 'text_content', label: 'Text Content' },
  { key: 'short_content', label: 'Short Content' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated tag titles.' },
  { key: 'tag_ids', label: 'Tag IDs', description: 'Comma-separated tag IDs.' },
  { key: 'replies_count', label: 'Replies Count', format: 'number' },
  { key: 'reactions_count', label: 'Reactions Count', format: 'number' },
  { key: 'locked', label: 'Locked', format: 'boolean' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
];

const memberFields: OutputSchemaField[] = [
  { key: 'id', label: 'Member ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email', description: 'Only visible to admins and the member themselves.' },
  { key: 'username', label: 'Username' },
  { key: 'tagline', label: 'Tagline' },
  { key: 'status', label: 'Status' },
  { key: 'role_id', label: 'Role ID' },
  { key: 'role_name', label: 'Role Name' },
  { key: 'url', label: 'Profile URL', format: 'url' },
  { key: 'created_at', label: 'Joined At', format: 'datetime' },
];

const spaceFields: OutputSchemaField[] = [
  { key: 'id', label: 'Space ID' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'description', label: 'Description' },
  { key: 'type', label: 'Type' },
  { key: 'private', label: 'Private', format: 'boolean' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'members_count', label: 'Members Count', format: 'number' },
  { key: 'posts_count', label: 'Posts Count', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const spaceMemberFields: OutputSchemaField[] = [
  { key: 'member_id', label: 'Member ID' },
  { key: 'member_name', label: 'Member Name' },
  { key: 'member_email', label: 'Member Email', format: 'email' },
  { key: 'member_username', label: 'Member Username' },
  { key: 'role_id', label: 'Space Role ID' },
  { key: 'role_name', label: 'Space Role Name' },
];

const postTypeFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post Type ID' },
  { key: 'name', label: 'Name' },
  { key: 'plural_name', label: 'Plural Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'context', label: 'Context', description: 'post for top-level posts, reply for reply types.' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
];

const tagFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tag ID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
];

const badgeFields: OutputSchemaField[] = [
  { key: 'id', label: 'Badge ID' },
  { key: 'name', label: 'Name' },
  { key: 'short_description', label: 'Short Description' },
  { key: 'type', label: 'Type' },
  { key: 'active', label: 'Active', format: 'boolean' },
];

const eventFields: OutputSchemaField[] = [
  { key: 'id', label: 'Event ID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'status', label: 'Status' },
  { key: 'space_id', label: 'Space ID' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'end_time', label: 'End Time', format: 'datetime' },
  { key: 'time_zone', label: 'Time Zone' },
  { key: 'capacity', label: 'Capacity', format: 'number' },
  { key: 'registrations_count', label: 'Registrations Count', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const moderationFields: OutputSchemaField[] = [
  { key: 'id', label: 'Moderation Item ID' },
  { key: 'status', label: 'Status' },
  { key: 'flagged_by', label: 'Flagged By' },
  { key: 'description', label: 'Description' },
  { key: 'member_id', label: 'Member ID' },
  { key: 'space_id', label: 'Space ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const invitationFields: OutputSchemaField[] = [
  { key: 'id', label: 'Invitation ID' },
  { key: 'invitee_email', label: 'Invitee Email', format: 'email' },
  { key: 'invitee_name', label: 'Invitee Name' },
  { key: 'status', label: 'Status' },
  { key: 'expires_at', label: 'Expires At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const networkFields: OutputSchemaField[] = [
  { key: 'id', label: 'Community ID' },
  { key: 'name', label: 'Name' },
  { key: 'domain', label: 'Domain' },
  { key: 'description', label: 'Description' },
  { key: 'plan_name', label: 'Plan' },
  { key: 'members_count', label: 'Members Count', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

function actionResult(extra: OutputSchemaField[]): OutputSchema {
  return {
    fields: [
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'status', label: 'Bettermode Status', description: 'succeeded or failed, as reported by Bettermode.' },
      ...extra,
    ],
  };
}

export const bettermodeSchemas = {
  post: { fields: postFields },
  member: { fields: memberFields },
  space: { fields: spaceFields },
  network: { fields: networkFields },
  posts: pageSchema({ label: 'Posts', labelKey: 'title', itemFields: postFields }),
  members: pageSchema({ label: 'Members', labelKey: 'name', itemFields: memberFields }),
  spaces: pageSchema({ label: 'Spaces', labelKey: 'name', itemFields: spaceFields }),
  spaceMembers: pageSchema({ label: 'Space Members', labelKey: 'member_name', itemFields: spaceMemberFields }),
  postTypes: pageSchema({ label: 'Post Types', labelKey: 'name', itemFields: postTypeFields }),
  tags: pageSchema({ label: 'Tags', labelKey: 'title', itemFields: tagFields }),
  events: pageSchema({ label: 'Events', labelKey: 'title', itemFields: eventFields }),
  moderationItems: pageSchema({ label: 'Moderation Items', labelKey: 'id', itemFields: moderationFields }),
  badges: {
    fields: [
      { key: 'items', label: 'Badges', labelKey: 'name', listItems: badgeFields },
      { key: 'count', label: 'Badge Count', format: 'number' },
    ],
  },
  findMember: {
    fields: [
      { key: 'found', label: 'Found', format: 'boolean' },
      { key: 'member', label: 'Member', children: memberFields },
    ],
  },
  spaceMembership: {
    fields: [
      { key: 'space_id', label: 'Space ID' },
      { key: 'member_ids', label: 'Member IDs', description: 'Comma-separated member IDs.' },
      { key: 'items', label: 'Space Members', labelKey: 'member_name', listItems: spaceMemberFields },
    ],
  },
  removeFromSpace: actionResult([
    { key: 'space_id', label: 'Space ID' },
    { key: 'member_ids', label: 'Member IDs', description: 'Comma-separated member IDs.' },
  ]),
  postAction: actionResult([{ key: 'post_id', label: 'Post ID' }]),
  reaction: actionResult([
    { key: 'post_id', label: 'Post ID' },
    { key: 'reaction', label: 'Reaction' },
  ]),
  memberAction: actionResult([{ key: 'member_id', label: 'Member ID' }]),
  badgeAction: actionResult([
    { key: 'badge_id', label: 'Badge ID' },
    { key: 'member_id', label: 'Member ID' },
  ]),
  legacyBadgeAction: actionResult([
    { key: 'badge_id', label: 'Badge ID' },
    { key: 'member_id', label: 'Member ID' },
    { key: 'member_name', label: 'Member Name' },
    { key: 'member_email', label: 'Member Email', format: 'email' },
  ]),
  eventRegistration: actionResult([{ key: 'event_id', label: 'Event ID' }]),
  deleted: {
    fields: [
      { key: 'id', label: 'Deleted ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'status', label: 'Bettermode Status' },
    ],
  },
  invitations: {
    fields: [
      { key: 'items', label: 'Invitations', labelKey: 'invitee_email', listItems: invitationFields },
      { key: 'count', label: 'Invitations Sent', format: 'number' },
    ],
  },
  message: {
    fields: [
      { key: 'message_id', label: 'Message ID' },
      { key: 'chat_id', label: 'Chat ID' },
      { key: 'recipient_id', label: 'Recipient Member ID' },
      { key: 'content', label: 'Content' },
      { key: 'sent_at', label: 'Sent At', format: 'datetime' },
    ],
  },
  legacyPost: {
    fields: [{ key: 'createdAt', label: 'Created At (legacy key)', format: 'datetime' }, ...postFields],
  },
} satisfies Record<string, OutputSchema>;
