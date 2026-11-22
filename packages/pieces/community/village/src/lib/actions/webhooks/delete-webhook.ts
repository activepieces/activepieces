import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const deleteWebhook = createAction({
  auth: villageAuth,
  name: 'delete_webhook',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Webhook',
  description: 'Permanently delete a webhook so Village stops sending events to it. Free.',
  audience: 'human',
  aiMetadata: {
    description: 'Permanently deletes a webhook by ID. A repeat call on a deleted webhook is expected to fail with not found.',
    idempotent: false,
  },
  outputSchema: villageSchemas.messageResult,
  props: {
    id: Property.ShortText({ displayName: 'Webhook ID', required: true }),
  },
  async run(context) {
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/v2/webhooks/${villageApi.encodePathId(villageApi.requireText({ value: context.propsValue.id, field: 'Webhook ID' }))}`,
    });
  },
});
