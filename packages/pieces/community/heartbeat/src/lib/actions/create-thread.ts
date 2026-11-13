import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatProps } from '../common/props';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const createThreadAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_thread',
  classification: 'WRITE',
  displayName: 'Create Thread',
  description: 'Posts a new thread in a posts channel.',
  audience: 'both',
  aiMetadata: {
    description: 'Posts a new thread in a posts channel as the API-key admin or another admin, with HTML-subset text; @<user or group ID> mentions notify those people. Use for announcements; get the channel ID from List Channels (type POSTS). Not idempotent: each call posts again.',
    idempotent: false,
  },
  props: {
    channelId: heartbeatProps.id({ displayName: 'Channel ID', description: 'A posts channel. Use List Channels to find the ID.', required: true }),
    text: heartbeatProps.richText({ displayName: 'Text', required: true }),
    authorUserId: heartbeatProps.author({ displayName: 'Author (Admin User ID)' }),
    createdAt: Property.DateTime({ displayName: 'Created At', description: 'Optional backdated creation time, for example when migrating posts. Defaults to now.', required: false }),
  },
  outputSchema: heartbeatOutputSchemas.createdThread,
  async run({ auth, propsValue }) {
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/threads',
      operation: 'create thread',
      body: {
        text: heartbeatApi.richText({ value: propsValue.text, label: 'Text' }),
        channelID: heartbeatApi.uuid({ value: propsValue.channelId, label: 'Channel ID' }),
        userID: heartbeatApi.optionalUuid({ value: propsValue.authorUserId, label: 'Author (Admin User ID)' }),
        createdAt: heartbeatApi.isoDate({ value: propsValue.createdAt, label: 'Created At' }),
      },
    });
  },
});
