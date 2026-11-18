import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const createCommentAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_comment',
  classification: 'WRITE',
  displayName: 'Reply to Thread',
  description: 'Adds a comment to a thread, or a reply to a comment.',
  audience: 'both',
  aiMetadata: {
    description: 'Adds a comment to a thread, or a reply under an existing top-level comment when Parent Comment ID is given (Heartbeat has two levels), as the API-key admin or another admin; @<ID> mentions notify people. Get IDs from Get Thread. Not idempotent: each call posts another comment.',
    idempotent: false,
  },
  props: {
    threadId: heartbeatProps.id({ displayName: 'Thread ID', description: 'Use List Threads to find the ID.', required: true }),
    text: heartbeatProps.richText({ displayName: 'Text', required: true }),
    parentCommentId: heartbeatProps.id({ displayName: 'Parent Comment ID', description: 'Reply under this top-level comment. Leave empty to comment on the thread itself.', required: false }),
    authorUserId: heartbeatProps.author({ displayName: 'Author (Admin User ID)' }),
    createdAt: Property.DateTime({ displayName: 'Created At', description: 'Optional backdated creation time. Defaults to now.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.comment,
  async run({ auth, propsValue }) {
    const threadId = heartbeatApi.uuid({ value: propsValue.threadId, label: 'Thread ID' });
    const parentCommentId = heartbeatApi.optionalUuid({ value: propsValue.parentCommentId, label: 'Parent Comment ID' }) ?? null;
    const comment = await heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/comments',
      operation: 'create comment',
      body: {
        text: heartbeatApi.richText({ value: propsValue.text, label: 'Text' }),
        threadID: threadId,
        parentCommentID: parentCommentId,
        userID: heartbeatApi.optionalUuid({ value: propsValue.authorUserId, label: 'Author (Admin User ID)' }),
        createdAt: heartbeatApi.isoDate({ value: propsValue.createdAt, label: 'Created At' }),
      },
    });
    return { ...comment, threadId, parentCommentId };
  },
});
