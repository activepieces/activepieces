import z from 'zod';

export const sendMessageSchema = {
  spaceId: z.string().min(1, 'Space ID is required'),
  text: z.string().min(1, 'Message text is required'),
  thread: z.string().optional(),
  messageReplyOption: z.enum([
    'REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD',
    'REPLY_MESSAGE_OR_FAIL'
  ]).optional(),
  customMessageId: z.string().regex(
    /^[a-z0-9-]+$/,
    'Custom message ID must contain only lowercase letters, numbers, and hyphens'
  ).max(63, 'Custom message ID must be 63 characters or less').optional(),
  isPrivate: z.boolean().optional(),
  privateMessageViewer: z.string().optional(),
};

export const spaceIdSchema = z.string().regex(
  /^spaces\/[a-zA-Z0-9_-]+$/,
  'Space ID must be in format: spaces/{space}'
);

export const threadIdSchema = z.string().regex(
  /^spaces\/[a-zA-Z0-9_-]+\/threads\/[a-zA-Z0-9_-]+$/,
  'Thread ID must be in format: spaces/{space}/threads/{thread}'
);

export const userResourceNameSchema = z.string().regex(
  /^people\/[a-zA-Z0-9_-]+$/,
  'User resource name must be in format: people/{person}'
);

export const customMessageIdSchema = z.string()
  .regex(
    /^client-[a-z0-9-]+$/,
    'Custom message ID must start with "client-" and contain only lowercase letters, numbers, and hyphens'
  )
  .max(63, 'Custom message ID must be 63 characters or less');

export const messageTextSchema = z.string()
  .min(1, 'Message text cannot be empty')
  .max(32000, 'Message text cannot exceed 32,000 characters');

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
  name: z.string()
    .min(1, 'Message resource name is required')
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+\/messages\/[a-zA-Z0-9_-]+$/,
      'Message resource name must be in format: spaces/{space}/messages/{message}'
    ),
};

export const addSpaceMemberSchema = {
  spaceId: z.string()
    .min(1, 'Space ID is required')
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+$/,
      'Space ID must be in format: spaces/{space}'
    ),
  personId: z.string()
    .min(1, 'Person ID is required')
    .regex(
      /^people\/[a-zA-Z0-9_-]+$/,
      'Person ID must be in format: people/{person}'
    ),
};

export const findMemberSchema = {
  spaceId: z.string()
    .min(1, 'Space ID is required')
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+$/,
      'Space ID must be in format: spaces/{space}'
    ),
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
};

export const searchMessagesSchema = {
  spaceId: z.string()
    .min(1, 'Space ID is required')
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+$/,
      'Space ID must be in format: spaces/{space}'
    ),
  keyword: z.string()
    .min(1, 'Search keyword is required')
    .min(2, 'Search keyword must be at least 2 characters long'),
  limit: z.number()
    .min(1, 'Limit must be at least 1')
    .max(1000, 'Limit cannot exceed 1000')
    .optional(),
};

export const getDirectMessageDetailsSchema = {
  directMessageId: z.string()
    .min(1, 'Direct message ID is required')
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+$/,
      'Direct message ID must be in format: spaces/{space}'
    ),
};

export const newMessageTriggerSchema = {
  projectId: z.string()
    .min(1, 'Project ID is required'),
  spaceId: z.string()
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+$/,
      'Space ID must be in format: spaces/{space}'
    )
    .optional(),
};

export const newMentionTriggerSchema = {
  projectId: z.string()
    .min(1, 'Project ID is required'),
  spaceId: z.string()
    .regex(
      /^spaces\/[a-zA-Z0-9_-]+$/,
      'Space ID must be in format: spaces/{space}'
    )
    .optional(),
  spaceMemberId: z.string()
    .regex(
      /^users\/[a-zA-Z0-9_-]+$/,
      'Space member ID must be in format: users/{user}'
    )
    .optional(),
};
