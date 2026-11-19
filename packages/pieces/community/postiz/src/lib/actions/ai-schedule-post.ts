import { createAction, Property } from '@activepieces/pieces-framework';
import { postizAuth } from '../common/auth';
import { aiCreatedPostOutputSchema, aiPostProps, createAiPost, parseDate } from '../common/post-body';

export const aiSchedulePost = createAction({
  auth: postizAuth,
  name: 'ai_schedule_post',
  classification: 'WRITE',
  displayName: 'Schedule Post',
  description: 'Schedules a post on one channel for a future date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Schedules a post on one connected Postiz channel; Postiz publishes it automatically at the given date. Use when the user wants content to go out later; use Find Available Slot to pick a free time. The publish date must be an ISO 8601 date in the future. Needs a channel ID from List Channels; media must be IDs or paths from Upload File from URL or List Media; settings follow Get Channel Settings and the platform type is filled in automatically. Not idempotent: each call schedules a new post.',
    idempotent: false,
  },
  outputSchema: aiCreatedPostOutputSchema,
  props: {
    ...aiPostProps(),
    publish_date: Property.ShortText({
      displayName: 'Publish Date',
      description: 'Future date and time in ISO 8601, for example 2026-12-01T09:00:00Z.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const date = parseDate({ value: propsValue.publish_date, label: 'Publish Date' });
    if (date === undefined) {
      throw new Error('Publish Date is required.');
    }
    if (new Date(date).getTime() <= Date.now()) {
      throw new Error(`Publish Date must be in the future, got ${date}.`);
    }
    return createAiPost({ auth, type: 'schedule', date, propsValue });
  },
});
