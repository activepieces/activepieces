import * as z from 'zod/mini'

export const sendMessageSchema = {
  spaceId: z.string().check(z.minLength(1, 'Space ID is required')),
  text: z.string().check(z.minLength(1, 'Message text is required')),
  thread: z.optional(z.string()),
  messageReplyOption: z.optional(z.enum([
    'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD',
    'REPLY_MESSAGE_OR_FAIL'
  ])),
  customMessageId: z.optional(z.string().check(z.regex(/^[a-z0-9-]+$/, 'Custom message ID must contain only lowercase letters, numbers, and hyphens'), z.maxLength(63, 'Custom message ID must be 63 characters or less'))),
  isPrivate: z.optional(z.boolean()),
  privateMessageViewer: z.optional(z.string()),
};

export const spaceIdSchema = z.string().check(z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Space ID must be in format: spaces/{space}'));

export const threadIdSchema = z.string().check(z.regex(/^spaces\/[a-zA-Z0-9_-]+\/threads\/[a-zA-Z0-9_-]+$/, 'Thread ID must be in format: spaces/{space}/threads/{thread}'));

export const userResourceNameSchema = z.string().check(z.regex(/^people\/[a-zA-Z0-9_-]+$/, 'User resource name must be in format: people/{person}'));

export const customMessageIdSchema = z.string().check(z.regex(/^client-[a-z0-9-]+$/, 'Custom message ID must start with "client-" and contain only lowercase letters, numbers, and hyphens'), z.maxLength(63, 'Custom message ID must be 63 characters or less'));

export const messageTextSchema = z.string().check(z.minLength(1, 'Message text cannot be empty'), z.maxLength(32000, 'Message text cannot exceed 32,000 characters'));

export const validateSpaceFromDropdown = z.object({
  value: spaceIdSchema,
  label: z.string(),
});

export const validateThreadFromDropdown = z.object({
  value: z.union([z.literal(''), threadIdSchema]),
  label: z.string(),
});

export const validateUserFromDropdown = z.object({
  value: userResourceNameSchema,
  label: z.string(),
});

export const getMessageSchema = {
  name: z.string().check(z.minLength(1, 'Message resource name is required'), z.regex(/^spaces\/[a-zA-Z0-9_-]+\/messages\/[a-zA-Z0-9_-]+$/, 'Message resource name must be in format: spaces/{space}/messages/{message}')),
};

export const addSpaceMemberSchema = {
  spaceId: z.string().check(z.minLength(1, 'Space ID is required'), z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Space ID must be in format: spaces/{space}')),
  personId: z.string().check(z.minLength(1, 'Person ID is required'), z.regex(/^people\/[a-zA-Z0-9_-]+$/, 'Person ID must be in format: people/{person}')),
};

export const findMemberSchema = {
  spaceId: z.string().check(z.minLength(1, 'Space ID is required'), z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Space ID must be in format: spaces/{space}')),
  email: z.string().check(z.minLength(1, 'Email is required'), z.email('Please enter a valid email address')),
};

export const searchMessagesSchema = {
  spaceId: z.string().check(z.minLength(1, 'Space ID is required'), z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Space ID must be in format: spaces/{space}')),
  keyword: z.string().check(z.minLength(1, 'Search keyword is required'), z.minLength(2, 'Search keyword must be at least 2 characters long')),
  limit: z.optional(z.number().check(z.minimum(1, 'Limit must be at least 1'), z.maximum(1000, 'Limit cannot exceed 1000'))),
};

export const getDirectMessageDetailsSchema = {
  directMessageId: z.string().check(z.minLength(1, 'Direct message ID is required'), z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Direct message ID must be in format: spaces/{space}')),
};

export const newMessageTriggerSchema = {
  projectId: z.string().check(z.minLength(1, 'Project ID is required')),
  spaceId: z.optional(z.string().check(z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Space ID must be in format: spaces/{space}'))),
};

export const newMentionTriggerSchema = {
  projectId: z.string().check(z.minLength(1, 'Project ID is required')),
  spaceId: z.optional(z.string().check(z.regex(/^spaces\/[a-zA-Z0-9_-]+$/, 'Space ID must be in format: spaces/{space}'))),
  spaceMemberId: z.optional(z.string().check(z.regex(/^users\/[a-zA-Z0-9_-]+$/, 'Space member ID must be in format: users/{user}'))),
};
