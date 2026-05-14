import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendrAuth } from '../auth';
import { sendrApiCall } from '../common';

export const listCampaigns = createAction({
  auth: sendrAuth,
  name: 'list_campaigns',
  displayName: 'List Campaigns',
  description: 'Lists all campaigns in your Sendr workspace, optionally filtered by status.',
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status Filter',
      description: 'Filter campaigns by their current status.',
      required: false,
      defaultValue: '',
      options: {
        options: [
          { label: 'All', value: '' },
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Active', value: 'ACTIVE' },
          { label: 'Paused', value: 'PAUSED' },
        ],
      },
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = { limit: '50' };
    if (context.propsValue.status) {
      queryParams.status = context.propsValue.status;
    }
    const response = await sendrApiCall<{
      items: { id: string; name?: string; status?: string; createdAt?: string; [key: string]: unknown }[];
    }>({
      token: context.auth as unknown as string,
      method: HttpMethod.GET,
      path: '/campaigns',
      queryParams,
    });
    const items = response.body?.items ?? [];
    return items.map((item) => ({
      id: item.id,
      name: item.name ?? null,
      status: item.status ?? null,
      created_at: item.createdAt ?? null,
    }));
  },
});
