import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const setCustomStatusAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_set_custom_status',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Set Custom Status',
  description: 'Sets the connected user\'s custom status message.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the connected user\'s custom status (emoji and text, e.g. "In a meeting") and how long it lasts; it also joins their recent custom statuses. Only works for the connected account. Duration "date_and_time" needs Expires At. To remove it use Clear Custom Status.',
    idempotent: true,
  },
  props: {
    emoji: Property.ShortText({
      displayName: 'Emoji',
      description: 'Emoji name without colons, e.g. "calendar".',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'Status text, up to 100 characters.',
      required: true,
    }),
    duration: Property.StaticDropdown({
      displayName: 'Duration',
      description:
        'How long it lasts: "thirty_minutes", "one_hour", "four_hours", "today", "this_week" or "date_and_time". Leave empty to keep it until cleared.',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: '30 Minutes', value: 'thirty_minutes' },
          { label: '1 Hour', value: 'one_hour' },
          { label: '4 Hours', value: 'four_hours' },
          { label: 'Today', value: 'today' },
          { label: 'This Week', value: 'this_week' },
          { label: 'Until Expires At', value: 'date_and_time' },
        ],
      },
    }),
    expiresAt: Property.ShortText({
      displayName: 'Expires At',
      description: 'ISO 8601 date-time when the status ends, e.g. "2026-11-03T17:00:00Z". Needed for duration "date_and_time".',
      required: false,
    }),
  },
  async run(context) {
    const { emoji, text, duration, expiresAt } = context.propsValue;
    if (duration && !DURATIONS.includes(duration)) {
      throw new Error(`Duration must be one of ${DURATIONS.join(', ')}, got "${duration}".`);
    }
    if (duration === 'date_and_time' && !expiresAt) {
      throw new Error('Duration "date_and_time" needs Expires At.');
    }
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: '/users/me/status/custom',
      body: {
        emoji,
        text,
        ...(duration ? { duration } : {}),
        ...(expiresAt ? { expires_at: expiresAt } : {}),
      },
    });
  },
});

const DURATIONS = ['thirty_minutes', 'one_hour', 'four_hours', 'today', 'this_week', 'date_and_time'];
