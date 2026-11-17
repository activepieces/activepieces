import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

const LEVELS = ['all', 'mention', 'none', 'default'] as const;
const EMAIL_LEVELS = ['true', 'false', 'default'] as const;
const MARK_UNREAD_LEVELS = ['all', 'mention'] as const;

export const updateChannelNotifyPropsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_channel_notify_props',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Update Channel Notifications',
  description: 'Changes a user\'s notification settings for a channel.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Changes a user\'s email, push and desktop notification levels and unread marking for one channel; pass "me" for the connected account. Fields left empty stay as they are; "default" falls back to the user\'s global setting. Set at least one field.',
    idempotent: true,
  },
  props: {
    channelId: mattermostAiProps.channelId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
    desktop: levelDropdown({ displayName: 'Desktop', options: LEVELS }),
    push: levelDropdown({ displayName: 'Push', options: LEVELS }),
    email: levelDropdown({ displayName: 'Email', options: EMAIL_LEVELS }),
    markUnread: levelDropdown({ displayName: 'Mark Unread', options: MARK_UNREAD_LEVELS }),
  },
  async run(context) {
    const { channelId, userId, desktop, push, email, markUnread } = context.propsValue;
    checkLevel({ field: 'Desktop', value: desktop, allowed: LEVELS });
    checkLevel({ field: 'Push', value: push, allowed: LEVELS });
    checkLevel({ field: 'Email', value: email, allowed: EMAIL_LEVELS });
    checkLevel({ field: 'Mark Unread', value: markUnread, allowed: MARK_UNREAD_LEVELS });
    const body = {
      ...(desktop !== undefined ? { desktop } : {}),
      ...(push !== undefined ? { push } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(markUnread !== undefined ? { mark_unread: markUnread } : {}),
    };
    if (Object.keys(body).length === 0) {
      throw new Error('Set at least one of Desktop, Push, Email or Mark Unread.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/channels/${encodeURIComponent(channelId)}/members/${encodeURIComponent(userId)}/notify_props`,
      body,
    });
  },
});

function levelDropdown({ displayName, options }: { displayName: string; options: readonly string[] }) {
  return Property.StaticDropdown({
    displayName,
    description: `One of ${options.map((option) => `"${option}"`).join(', ')}.`,
    required: false,
    options: {
      disabled: false,
      options: options.map((option) => ({ label: option, value: option })),
    },
  });
}

function checkLevel({
  field,
  value,
  allowed,
}: {
  field: string;
  value: string | undefined;
  allowed: readonly string[];
}): void {
  if (value !== undefined && !allowed.includes(value)) {
    throw new Error(`${field} must be one of ${allowed.join(', ')}, got "${value}".`);
  }
}
