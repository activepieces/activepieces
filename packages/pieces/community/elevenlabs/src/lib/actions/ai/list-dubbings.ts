import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { elevenlabsAuth } from '../../auth';
import { elevenlabsClient } from '../../client';
import { elevenlabsListDubbingsOutputSchema } from '../../output-schemas';

export const listDubbings = createAction({
  auth: elevenlabsAuth,
  name: 'elevenlabs_list_dubbings',
  outputSchema: elevenlabsListDubbingsOutputSchema,
  displayName: 'List Dubbings',
  description: 'List dubbing projects',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Lists dubbing projects with their ids, names and status. Filter by status and page with next_cursor. Use to find a dubbing_id.',
    idempotent: true,
  },
  props: {
    cursor: Property.ShortText({ displayName: 'Cursor', description: 'next_cursor from a previous call', required: false }),
    pageSize: Property.Number({ displayName: 'Page Size', description: 'Between 1 and 200', required: false }),
    dubbingStatus: Property.StaticDropdown({ displayName: 'Dubbing Status', required: false, options: { options: [{ label: 'dubbing', value: 'dubbing' }, { label: 'dubbed', value: 'dubbed' }, { label: 'failed', value: 'failed' }] } }),
    orderBy: Property.StaticDropdown({ displayName: 'Order By', required: false, options: { options: [{ label: 'created_at', value: 'created_at' }, { label: 'name', value: 'name' }] } }),
    orderDirection: Property.StaticDropdown({ displayName: 'Order Direction', required: false, options: { options: [{ label: 'DESCENDING', value: 'DESCENDING' }, { label: 'ASCENDING', value: 'ASCENDING' }] } }),
  },
  async run({ auth, propsValue }) {
    const response = await elevenlabsClient.request<Record<string, unknown> & { dubs: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/v1/dubbing`,
      queryParams: { cursor: propsValue.cursor, page_size: propsValue.pageSize, dubbing_status: propsValue.dubbingStatus, order_by: propsValue.orderBy, order_direction: propsValue.orderDirection },
    });
    return { ...response, count: response.dubs.length };
  },
});
