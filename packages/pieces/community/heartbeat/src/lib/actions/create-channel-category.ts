import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const createChannelCategoryAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_create_channel_category',
  classification: 'WRITE',
  displayName: 'Create Channel Category',
  description: 'Creates a channel category (sidebar section).',
  audience: 'both',
  aiMetadata: {
    description: 'Creates a channel category (a sidebar section that groups channels) and returns its ID and name. Use before Create Channel when no suitable category exists. Not idempotent: each call creates another category even with the same name.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
  },
  outputSchema: heartbeatOutputSchemas.category,
  async run({ auth, propsValue }) {
    return heartbeatApi.request<Record<string, unknown>>({
      token: auth.secret_text,
      method: HttpMethod.PUT,
      path: '/channelCategories',
      operation: 'create channel category',
      body: { name: heartbeatApi.requiredText({ value: propsValue.name, label: 'Name' }) },
    });
  },
});
