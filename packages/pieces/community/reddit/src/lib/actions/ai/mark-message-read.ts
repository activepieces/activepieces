import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { redditAuth } from '../../auth';
import { redditApi } from '../../common/client';
import { redditMarkMessageReadOutputSchema } from '../../output-schemas';

export const redditMarkMessageRead = createAction({
  auth: redditAuth,
  name: 'reddit_mark_message_read',
  outputSchema: redditMarkMessageReadOutputSchema,
  displayName: 'Mark Messages Read',
  description: 'Marks inbox items as read.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Marks inbox items as read: private messages (t4_) or comment replies and mentions (t1_), comma-separated with their prefixes, from List Messages. Use Mark All Messages Read to clear the whole inbox. Needs the `privatemessages` scope: older connections must reconnect.',
    idempotent: true,
  },
  props: {
    ids: Property.ShortText({ displayName: 'Fullnames', description: 'Comma-separated fullnames, e.g. "t4_abc123,t1_def456".', required: true }),
  },
  async run({ auth, propsValue }) {
    const ids = propsValue.ids
      .split(',')
      .filter((id) => id.trim() !== '')
      .map((id) => redditApi.requireFullname({ value: id, label: 'Each id' }));
    if (ids.length === 0) {
      throw new Error('Provide at least one fullname.');
    }
    await redditApi.request<unknown>({ auth, method: HttpMethod.POST, path: '/api/read_message', form: { id: ids.join(',') } });
    return { success: true, ids, read: true };
  },
});
