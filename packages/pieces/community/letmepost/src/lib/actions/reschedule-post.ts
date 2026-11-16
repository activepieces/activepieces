import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { letmepostAuth } from '../common/auth';
import { letmepostClient } from '../common/client';
import { postOutputSchema } from '../common/output-schemas';

export const reschedulePost = createAction({
  auth: letmepostAuth,
  name: 'reschedule_post',
  classification: 'WRITE',
  displayName: 'Reschedule a Post',
  description: 'Move a queued scheduled post to a new time',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes the publish time of one queued scheduled post, by its letmepost post id, and returns the updated post. The new time must be in the future, and the post must still be queued; otherwise letmepost answers 409. To stop a post from publishing use Cancel a Scheduled Post. Setting the same time again leaves the post unchanged.',
    idempotent: true,
  },
  props: {
    postId: Property.ShortText({
      displayName: 'Post ID',
      description: 'The letmepost post id of the queued post (from the Post IDs of a publish, or List Posts).',
      required: true,
    }),
    scheduledAt: Property.DateTime({
      displayName: 'New time',
      description: 'When the post should publish instead (must be in the future).',
      required: true,
    }),
  },
  outputSchema: postOutputSchema,
  async run(context) {
    const raw = letmepostClient.optionalText(context.propsValue.scheduledAt);
    const date = raw === undefined ? undefined : new Date(raw);
    if (date === undefined || Number.isNaN(date.getTime())) {
      throw new Error('New time must be a valid date and time.');
    }
    if (date.getTime() <= Date.now()) {
      throw new Error('New time must be in the future.');
    }
    return letmepostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PATCH,
      path: `/v1/posts/${letmepostClient.segment({ value: context.propsValue.postId, label: 'Post ID' })}`,
      body: { scheduledAt: date.toISOString() },
      operation: 'reschedule the post',
    });
  },
});
