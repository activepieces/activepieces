import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { antworkAuth } from '../auth';
import { antworkApiCall, antworkCommon, idempotencyKey } from '../common';

export const schedulePost = createAction({
  auth: antworkAuth,
  name: 'schedule_post',
  classification: 'WRITE',
  displayName: 'Schedule Post',
  description: 'Schedule an existing post. It goes public on the social account at that time.',
  audience: 'both',
  aiMetadata: {
    description:
      'Schedules an existing Antwork post (usually the id returned by Create Draft Post) to publish publicly at the given time, at most 30 days ahead. Only call after the user approved the post. Needs the `publish` scope. Safe to retry within a run: the same post and time return the first answer.',
    idempotent: true,
  },
  props: {
    postId: antworkCommon.post('draft'),
    scheduledFor: Property.DateTime({
      displayName: 'Publish At',
      description: 'In the future, at most 30 days ahead.',
      required: true,
    }),
  },
  async run(context) {
    const postId = context.propsValue.postId.trim();
    const body = { scheduledFor: new Date(context.propsValue.scheduledFor).toISOString() };
    const response = await antworkApiCall<Record<string, unknown>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/posts/${encodeURIComponent(postId)}/schedule`,
      body,
      idempotencyKey: idempotencyKey(context.run.id, `schedule-${postId}`, body),
    });
    return response.body;
  },
});
