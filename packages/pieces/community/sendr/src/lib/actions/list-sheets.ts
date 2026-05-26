import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const listSheets = createAction({
  auth: sendrAuth,
  name: 'list_sheets',
  displayName: 'List Sheets',
  description: 'Lists all available contact lists (sheets) in your Sendr workspace.',
  props: {},
  async run(context) {
    const response = await sendrApiCall<{
      items: { id: string; name?: string; campaignId?: string; createdAt?: string; updatedAt?: string; [key: string]: unknown }[];
    }>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/sheet',
    });

    const items = response.body?.items ?? [];
    return items.map((item) => ({
      id: item.id,
      name: item.name ?? null,
      campaign_id: item.campaignId ?? null,
      created_at: item.createdAt ?? null,
      updated_at: item.updatedAt ?? null,
    }));
  },
});
