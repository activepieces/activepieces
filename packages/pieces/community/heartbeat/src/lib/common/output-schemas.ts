import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function field({ key, label, format, description, value }: FieldParams): OutputSchemaField {
  return {
    key,
    label,
    ...(value !== undefined ? { value } : {}),
    ...(format !== undefined ? { format } : {}),
    ...(description !== undefined ? { description } : {}),
  };
}

function list({ key, label, items, labelKey, description }: ListParams): OutputSchemaField {
  return {
    key,
    label,
    listItems: items,
    ...(labelKey !== undefined ? { labelKey } : {}),
    ...(description !== undefined ? { description } : {}),
  };
}

function object({ key, label, children, description }: ObjectParams): OutputSchemaField {
  return { key, label, children, ...(description !== undefined ? { description } : {}) };
}

const idName: OutputSchemaField[] = [
  field({ key: 'id', label: 'ID' }),
  field({ key: 'name', label: 'Name' }),
];

const socialLinkFields: OutputSchemaField[] = [
  field({ key: 'linkedin', label: 'LinkedIn', format: 'url' }),
  field({ key: 'twitter', label: 'Twitter', format: 'url' }),
  field({ key: 'instagram', label: 'Instagram', format: 'url' }),
  field({ key: 'calendar', label: 'Calendar', format: 'url' }),
  field({ key: 'personalWebsite', label: 'Website', format: 'url' }),
  field({ key: 'community', label: 'Community', format: 'url' }),
];

const userSummaryFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'User ID', description: 'Use this to message the member or read their profile in a later step.' }),
  field({ key: 'email', label: 'Email', format: 'email' }),
  field({ key: 'name', label: 'Name' }),
  field({ key: 'firstName', label: 'First Name' }),
  field({ key: 'lastName', label: 'Last Name' }),
  field({ key: 'role', label: 'Role' }),
  field({ key: 'isAdmin', label: 'Is Admin', format: 'boolean' }),
  list({ key: 'groups', label: 'Groups', items: idName, labelKey: 'name' }),
  field({ key: 'bio', label: 'Bio' }),
  field({ key: 'avatar', label: 'Avatar', format: 'image' }),
  field({ key: 'createdAt', label: 'Joined At', format: 'datetime' }),
  field({ key: 'lastLogin', label: 'Last Login', format: 'datetime', description: 'Empty if the member never logged in.' }),
  object({ key: 'socialLinks', label: 'Social Links', children: socialLinkFields }),
];

const userFields: OutputSchemaField[] = [
  ...userSummaryFields,
  field({ key: 'linkedInSummary', label: 'LinkedIn Summary' }),
  object({
    key: 'linkedInData',
    label: 'LinkedIn Data',
    children: [
      field({ key: 'profileUrl', label: 'Profile URL', format: 'url' }),
      field({ key: 'headline', label: 'Headline' }),
      field({ key: 'company', label: 'Company' }),
      field({ key: 'location', label: 'Location' }),
    ],
  }),
  list({
    key: 'onboardingResponses',
    label: 'Onboarding Answers',
    labelKey: 'question',
    items: [
      field({ key: 'question', label: 'Question' }),
      field({ key: 'answer', label: 'Answer' }),
      field({ key: 'isPrivate', label: 'Private', format: 'boolean' }),
    ],
  }),
];

const groupFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Group ID' }),
  field({ key: 'name', label: 'Name' }),
  field({ key: 'description', label: 'Description', format: 'html' }),
  field({ key: 'color', label: 'Color' }),
  field({ key: 'parentGroupID', label: 'Parent Group ID', description: 'Empty for a top-level group.' }),
  field({ key: 'archived', label: 'Archived', format: 'boolean' }),
  list({
    key: 'users',
    label: 'Members',
    labelKey: 'name',
    items: [
      field({ key: 'id', label: 'User ID' }),
      field({ key: 'name', label: 'Name' }),
      field({ key: 'email', label: 'Email', format: 'email' }),
    ],
  }),
];

const channelFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Channel ID' }),
  field({ key: 'name', label: 'Name' }),
  field({ key: 'emoji', label: 'Emoji' }),
  field({ key: 'type', label: 'Type', description: 'POSTS (threads), CHAT or VOICE.' }),
];

const messageFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Message ID' }),
  field({ key: 'userID', label: 'Sender User ID' }),
  field({ key: 'content', label: 'Content', format: 'html' }),
  field({ key: 'createdAt', label: 'Sent At', format: 'datetime' }),
  field({ key: 'images', label: 'Images' }),
  field({ key: 'files', label: 'Files' }),
];

const replyFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Comment ID' }),
  field({ key: 'userID', label: 'Author User ID' }),
  field({ key: 'content', label: 'Content', format: 'html' }),
  field({ key: 'createdAt', label: 'Created At', format: 'datetime' }),
];

const commentFields: OutputSchemaField[] = [
  ...replyFields,
  field({ key: 'images', label: 'Images' }),
  field({ key: 'files', label: 'Files' }),
  list({ key: 'children', label: 'Replies', items: replyFields }),
];

const threadSummaryFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Thread ID' }),
  field({ key: 'channelID', label: 'Channel ID' }),
  field({ key: 'userID', label: 'Author User ID' }),
  field({ key: 'content', label: 'Content', format: 'html' }),
  field({ key: 'createdAt', label: 'Created At', format: 'datetime' }),
  field({ key: 'url', label: 'Thread URL', format: 'url' }),
  field({ key: 'files', label: 'Files' }),
];

const threadFields: OutputSchemaField[] = [
  ...threadSummaryFields,
  object({
    key: 'user',
    label: 'Author',
    children: [
      field({ key: 'id', label: 'User ID' }),
      field({ key: 'name', label: 'Name' }),
      field({ key: 'email', label: 'Email', format: 'email' }),
    ],
  }),
  list({ key: 'comments', label: 'Comments', items: commentFields }),
];

const eventFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Event ID' }),
  field({ key: 'name', label: 'Name' }),
  field({ key: 'description', label: 'Description', format: 'html' }),
  field({ key: 'startTime', label: 'Start Time', format: 'datetime', description: 'For recurring events this is the first occurrence and may be in the past.' }),
  field({ key: 'endTime', label: 'End Time', format: 'datetime' }),
  field({ key: 'recurring', label: 'Recurring', format: 'boolean' }),
  field({ key: 'createdAt', label: 'Created At', format: 'datetime' }),
  field({ key: 'createdBy', label: 'Created By (User ID)' }),
  field({ key: 'invitedUsers', label: 'Invited User IDs' }),
  field({ key: 'invitedGroups', label: 'Invited Group IDs' }),
  field({ key: 'coverImage', label: 'Cover Image', format: 'image' }),
];

const instanceFields: OutputSchemaField[] = [
  field({ key: 'startTime', label: 'Start Time', format: 'datetime' }),
  field({ key: 'endTime', label: 'End Time', format: 'datetime' }),
];

const invitationFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Invitation Link ID' }),
  field({ key: 'code', label: 'Code', description: 'The 6-character code in the invitation link.' }),
  object({ key: 'role', label: 'Role', children: idName }),
  list({ key: 'groups', label: 'Groups', items: idName, labelKey: 'name' }),
];

const lessonFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Lesson ID' }),
  field({ key: 'title', label: 'Title' }),
  field({ key: 'content', label: 'Content (Markdown)' }),
  field({ key: 'createdAt', label: 'Created At', format: 'datetime' }),
  field({ key: 'createdBy', label: 'Created By (User ID)' }),
  list({
    key: 'communityEmbedCards',
    label: 'Embedded Cards',
    labelKey: 'title',
    items: [field({ key: 'id', label: 'Card ID' }), field({ key: 'title', label: 'Title' }), field({ key: 'description', label: 'Description' })],
  }),
];

const documentSummaryFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Document ID' }),
  field({ key: 'name', label: 'Title' }),
  field({ key: 'link', label: 'Link', format: 'url' }),
];

const nextCursorField = field({ key: 'nextCursor', label: 'Next Cursor', description: 'Pass as Starting After to get the next page. Empty when there are no more.' });
const hasMoreField = field({ key: 'hasMore', label: 'Has More', format: 'boolean' });
const countField = field({ key: 'count', label: 'Count', format: 'number' });

const lookupErrorField = field({
  key: 'lookupError',
  label: 'Read-Back Error',
  description: 'Empty on success. Set when the change was saved but reading the result back failed; the step still succeeds so a retry does not repeat the change.',
});

const deletedFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'ID' }),
  field({ key: 'deleted', label: 'Deleted', format: 'boolean' }),
  field({ key: 'alreadyDeleted', label: 'Already Deleted', format: 'boolean', description: 'True when it was already gone before this run.' }),
];

export const heartbeatOutputSchemas = {
  user: { fields: userFields },
  createdUser: {
    fields: [
      field({ key: 'userID', label: 'User ID', description: 'ID of the new member.' }),
      ...userFields.filter((item) => item.key !== 'id'),
      lookupErrorField,
    ],
  },
  userList: {
    fields: [
      list({ key: 'users', label: 'Members', items: userSummaryFields, labelKey: 'name' }),
      countField,
      field({ key: 'totalMatching', label: 'Total Matching', format: 'number', description: 'All members matching the filters, even beyond the limit.' }),
      field({ key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when more members matched than the limit allowed.' }),
    ],
  },
  findUser: {
    fields: [
      field({ key: 'found', label: 'Found', format: 'boolean' }),
      object({ key: 'user', label: 'Member', children: userFields, description: 'Empty when no member has this email.' }),
    ],
  },
  updatedUser: {
    fields: [
      field({ key: 'email', label: 'Email', format: 'email' }),
      field({ key: 'updated', label: 'Updated', format: 'boolean' }),
      field({ key: 'updatedFields', label: 'Updated Fields' }),
      object({ key: 'user', label: 'Member', children: userSummaryFields }),
      lookupErrorField,
    ],
  },
  removedUser: {
    fields: [
      field({ key: 'email', label: 'Email', format: 'email' }),
      field({ key: 'removed', label: 'Removed', format: 'boolean' }),
    ],
  },
  reactivatedUser: {
    fields: [
      field({ key: 'email', label: 'Email', format: 'email' }),
      field({ key: 'reactivated', label: 'Reactivated', format: 'boolean' }),
      field({ key: 'alreadyActive', label: 'Already Active', format: 'boolean' }),
    ],
  },
  pendingUser: {
    fields: [
      field({ key: 'email', label: 'Email', format: 'email' }),
      field({ key: 'success', label: 'Success', format: 'boolean' }),
    ],
  },
  completedLessons: {
    fields: [
      list({
        key: 'items',
        label: 'Completed Lessons',
        items: [field({ key: 'lessonID', label: 'Lesson ID' }), field({ key: 'completedAt', label: 'Completed At', format: 'datetime' })],
      }),
      nextCursorField,
      hasMoreField,
    ],
  },
  markedLessons: {
    fields: [
      field({ key: 'email', label: 'Email', format: 'email' }),
      field({ key: 'lessonIds', label: 'Lesson IDs' }),
      field({ key: 'completedAt', label: 'Completed At', format: 'datetime' }),
      field({ key: 'confirmed', label: 'Confirmed Lesson IDs', description: 'Lessons that now show as completed for the member.' }),
      field({ key: 'notConfirmed', label: 'Not Confirmed Lesson IDs', description: 'Lessons Heartbeat did not record after a full check, usually because the lesson ID does not exist.' }),
      field({ key: 'unverified', label: 'Unverified Lesson IDs', description: 'Lessons that could not be checked because the read-back stopped early (more than 500 completions) or failed.' }),
      field({ key: 'checkComplete', label: 'Check Complete', format: 'boolean', description: 'False when some lessons could not be checked; see Unverified Lesson IDs.' }),
      lookupErrorField,
    ],
  },
  roleList: {
    fields: [list({ key: 'roles', label: 'Roles', items: idName, labelKey: 'name' }), countField],
  },
  groupList: {
    fields: [list({ key: 'groups', label: 'Groups', items: groupFields, labelKey: 'name' }), countField],
  },
  group: { fields: groupFields },
  createdGroup: { fields: [...groupFields, lookupErrorField] },
  updatedGroup: {
    fields: [
      field({ key: 'id', label: 'Group ID' }),
      field({ key: 'updated', label: 'Updated', format: 'boolean' }),
      field({ key: 'updatedFields', label: 'Updated Fields' }),
      object({ key: 'group', label: 'Group', children: groupFields }),
      lookupErrorField,
    ],
  },
  deleted: { fields: deletedFields },
  groupMembership: {
    fields: [
      field({ key: 'groupId', label: 'Group ID' }),
      field({ key: 'emails', label: 'Requested Emails' }),
      field({ key: 'added', label: 'In Group Now' }),
      field({ key: 'notAdded', label: 'Not Added', description: 'Emails that are not community members; Heartbeat ignores them.' }),
      field({ key: 'unverified', label: 'Unverified', description: 'Emails that could not be checked because reading the group back failed.' }),
      lookupErrorField,
    ],
  },
  groupRemoval: {
    fields: [
      field({ key: 'groupId', label: 'Group ID' }),
      field({ key: 'emails', label: 'Emails' }),
      field({ key: 'removed', label: 'Removed', format: 'boolean' }),
    ],
  },
  channelList: {
    fields: [list({ key: 'channels', label: 'Channels', items: channelFields, labelKey: 'name' }), countField],
  },
  categoryList: {
    fields: [list({ key: 'categories', label: 'Categories', items: idName, labelKey: 'name' }), countField],
  },
  category: { fields: idName },
  channel: { fields: channelFields },
  createdChannel: { fields: [...channelFields, lookupErrorField] },
  updatedChannel: {
    fields: [
      field({ key: 'id', label: 'Channel ID' }),
      field({ key: 'updated', label: 'Updated', format: 'boolean' }),
      field({ key: 'updatedFields', label: 'Updated Fields' }),
      object({ key: 'channel', label: 'Channel', children: channelFields }),
      lookupErrorField,
    ],
  },
  threadList: {
    fields: [
      list({
        key: 'threads',
        label: 'Threads',
        items: [...threadSummaryFields, field({ key: 'commentCount', label: 'Comment Count', format: 'number' }), list({ key: 'comments', label: 'Comments', items: commentFields })],
      }),
      nextCursorField,
      hasMoreField,
    ],
  },
  thread: { fields: threadFields },
  createdThread: { fields: [...threadSummaryFields, list({ key: 'comments', label: 'Comments', items: commentFields })] },
  comment: {
    fields: [
      ...commentFields,
      field({ key: 'threadId', label: 'Thread ID' }),
      field({ key: 'parentCommentId', label: 'Parent Comment ID', description: 'Empty for a comment on the thread itself.' }),
    ],
  },
  sentChatMessage: {
    fields: [
      field({ key: 'channelId', label: 'Channel ID' }),
      field({ key: 'sent', label: 'Sent', format: 'boolean' }),
      field({ key: 'messageId', label: 'Message ID', description: 'Empty if the message could not be matched right after sending.' }),
      object({ key: 'message', label: 'Message', children: messageFields }),
      lookupErrorField,
    ],
  },
  chatMessageList: {
    fields: [list({ key: 'messages', label: 'Messages', items: messageFields }), nextCursorField, hasMoreField],
  },
  sentDirectMessage: {
    fields: [
      field({ key: 'to', label: 'Recipient User ID' }),
      field({ key: 'from', label: 'Sender User ID', description: 'Empty when sent as the API-key admin.' }),
      field({ key: 'sent', label: 'Sent', format: 'boolean' }),
      field({ key: 'chatId', label: 'Chat ID', description: 'Returned when a Sender is set.' }),
      field({ key: 'chatUrl', label: 'Chat URL', format: 'url' }),
      field({ key: 'messageId', label: 'Message ID' }),
      lookupErrorField,
    ],
  },
  directChat: {
    fields: [field({ key: 'chatID', label: 'Chat ID' }), field({ key: 'url', label: 'Chat URL', format: 'url' })],
  },
  directMessageList: {
    fields: [field({ key: 'chatId', label: 'Chat ID' }), list({ key: 'messages', label: 'Messages', items: messageFields }), countField],
  },
  eventList: {
    fields: [
      list({ key: 'events', label: 'Events', items: eventFields, labelKey: 'name' }),
      countField,
      field({ key: 'totalMatching', label: 'Total Matching', format: 'number' }),
      field({ key: 'truncated', label: 'Truncated', format: 'boolean' }),
    ],
  },
  event: { fields: eventFields },
  eventWithInstances: {
    fields: [...eventFields, list({ key: 'instances', label: 'Occurrences', items: instanceFields, description: 'Only with Include Occurrences.' })],
  },
  createdEvent: {
    fields: [
      ...eventFields,
      object({
        key: 'location',
        label: 'Location',
        children: [
          field({ key: 'type', label: 'Type' }),
          field({ key: 'voiceChannelID', label: 'Voice Channel ID', description: 'Set when the event is held in a Heartbeat voice channel.' }),
          field({ key: 'locationStr', label: 'Custom Location', description: 'Set when a custom location was given.' }),
        ],
      }),
      lookupErrorField,
    ],
  },
  eventAttendance: {
    fields: [
      field({ key: 'eventId', label: 'Event ID' }),
      field({ key: 'happened', label: 'Has Happened', format: 'boolean', description: 'False when the event has not taken place yet.' }),
      list({
        key: 'instances',
        label: 'Occurrences',
        items: [
          ...instanceFields,
          list({
            key: 'attendees',
            label: 'Attendees',
            labelKey: 'name',
            items: [
              field({ key: 'id', label: 'User ID' }),
              field({ key: 'name', label: 'Name' }),
              field({ key: 'email', label: 'Email', format: 'email' }),
              field({ key: 'isUser', label: 'Is Member', format: 'boolean' }),
            ],
          }),
        ],
      }),
    ],
  },
  invitationList: {
    fields: [list({ key: 'invitations', label: 'Invitation Links', items: invitationFields, labelKey: 'code' }), countField],
  },
  invitation: { fields: invitationFields },
  invitationEmails: {
    fields: [
      field({ key: 'invitationId', label: 'Invitation Link ID' }),
      field({ key: 'emails', label: 'Emails' }),
      field({ key: 'emailSent', label: 'Invitation Email Sent', format: 'boolean' }),
    ],
  },
  courseList: {
    fields: [
      list({
        key: 'courses',
        label: 'Courses',
        labelKey: 'name',
        items: [
          field({ key: 'id', label: 'Course ID' }),
          field({ key: 'name', label: 'Name' }),
          field({ key: 'description', label: 'Description' }),
          field({ key: 'thumbnail', label: 'Thumbnail', format: 'image' }),
          list({
            key: 'cohorts',
            label: 'Cohorts',
            labelKey: 'name',
            items: [
              ...idName,
              list({
                key: 'modules',
                label: 'Modules',
                labelKey: 'name',
                items: [...idName, list({ key: 'lessons', label: 'Lessons', labelKey: 'name', items: idName })],
              }),
            ],
          }),
        ],
      }),
      countField,
    ],
  },
  lesson: { fields: lessonFields },
  documentList: {
    fields: [list({ key: 'documents', label: 'Documents', items: documentSummaryFields, labelKey: 'name' }), nextCursorField, hasMoreField],
  },
  document: {
    fields: [...documentSummaryFields, field({ key: 'content', label: 'Content (Markdown)' })],
  },
  mention: {
    fields: [
      field({ key: 'sourceType', label: 'Mentioned In', description: 'THREAD or COMMENT.' }),
      list({
        key: 'mentionedUsers',
        label: 'Mentioned',
        description: 'The chosen members or groups that were mentioned.',
        items: [field({ key: 'id', label: 'User or Group ID' }), field({ key: 'type', label: 'Type', description: 'USER or GROUP.' })],
      }),
      field({ key: 'authorUserId', label: 'Author User ID' }),
      field({ key: 'channelId', label: 'Channel ID' }),
      field({ key: 'threadId', label: 'Thread ID' }),
      field({ key: 'commentId', label: 'Comment ID', description: 'Empty when the mention is in the thread itself.' }),
      field({ key: 'content', label: 'Content', format: 'html' }),
      field({ key: 'threadUrl', label: 'Thread URL', format: 'url' }),
      object({ key: 'thread', label: 'Thread', children: threadSummaryFields }),
      object({ key: 'comment', label: 'Comment', children: commentFields }),
    ],
  },
  directMessageEvent: {
    fields: [
      field({ key: 'chatId', label: 'Chat ID' }),
      field({ key: 'messageId', label: 'Message ID' }),
      field({ key: 'senderUserId', label: 'Sender User ID' }),
      field({ key: 'receiverUserId', label: 'Receiver User ID' }),
      field({ key: 'content', label: 'Content', format: 'html' }),
      field({ key: 'createdAt', label: 'Sent At', format: 'datetime' }),
      field({ key: 'images', label: 'Images' }),
      field({ key: 'files', label: 'Files' }),
    ],
  },
} satisfies Record<string, OutputSchema>;

type FieldParams = {
  key: string;
  label: string;
  format?: OutputSchemaField['format'];
  description?: string;
  value?: string;
};

type ListParams = {
  key: string;
  label: string;
  items: OutputSchemaField[];
  labelKey?: string;
  description?: string;
};

type ObjectParams = {
  key: string;
  label: string;
  children: OutputSchemaField[];
  description?: string;
};
