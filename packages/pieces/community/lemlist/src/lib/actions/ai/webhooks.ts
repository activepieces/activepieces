import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { lemlistApiCall } from '../../common/client';
import { lemlistAuth } from '../../common/constants';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

export const listWebhooksAction = createAction({
  auth: lemlistAuth,
  name: 'list_webhooks',
  classification: 'SEARCH',
  displayName: 'List Webhooks',
  description: 'Lists the webhooks registered on the team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every webhook registered on the lemlist team (target URL, event type, campaign, disabled flag). A team can hold 200 webhooks, disabled ones included; use this to diagnose a full quota. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: lemlistSchemas.webhooks,
  async run({ auth }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/hooks',
    });
    const items = lemlistResults.listFrom({ body });
    return { items, count: items.length };
  },
});
