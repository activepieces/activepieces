import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listWebhooks = createAction({
  auth: villageAuth,
  name: 'list_webhooks',
  classification: 'SEARCH',
  displayName: 'List Webhooks',
  description: 'List the webhooks registered on your Village account. Free.',
  audience: 'human',
  aiMetadata: { description: 'Lists webhooks, cursor-paginated. Read-only.', idempotent: true },
  outputSchema: villageSchemas.listWebhooks,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Match part of the URL or description.',
      required: false,
    }),
    is_active: Property.StaticDropdown({
      displayName: 'State',
      required: false,
      options: {
        options: [
          { label: 'Active only', value: 'true' },
          { label: 'Paused only', value: 'false' },
        ],
      },
    }),
    limit: Property.Number({ displayName: 'Limit', description: '1-100, default 25.', required: false }),
    cursor: Property.ShortText({ displayName: 'Cursor', required: false }),
  },
  async run(context) {
    const { search, is_active, limit, cursor } = context.propsValue;
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/v2/webhooks',
      queryParams: {
        search: search ?? undefined,
        is_active: is_active ?? undefined,
        limit: String(villageApi.clampLimit({ value: limit, max: 100, fallback: 25 })),
        cursor: cursor ?? undefined,
      },
    });
  },
});
