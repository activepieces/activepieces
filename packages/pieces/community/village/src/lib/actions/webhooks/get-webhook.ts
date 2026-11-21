import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const getWebhook = createAction({
  auth: villageAuth,
  name: 'get_webhook',
  classification: 'READ',
  displayName: 'Get Webhook',
  description: 'Get one webhook by ID. The signing secret is never returned. Free.',
  audience: 'human',
  aiMetadata: { description: 'Reads one webhook by ID. Read-only.', idempotent: true },
  outputSchema: villageSchemas.singleWebhook,
  props: {
    id: Property.ShortText({ displayName: 'Webhook ID', required: true }),
  },
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/webhooks/${villageApi.encodePathId(villageApi.requireText({ value: context.propsValue.id, field: 'Webhook ID' }))}`,
    });
  },
});
