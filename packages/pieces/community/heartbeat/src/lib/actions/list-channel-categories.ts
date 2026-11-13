import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { heartbeatAuth } from '../auth';
import { heartbeatApi } from '../common/client';
import { heartbeatOutputSchemas } from '../common/output-schemas';

export const listChannelCategoriesAction = createAction({
  auth: heartbeatAuth,
  name: 'heartbeat_list_channel_categories',
  classification: 'SEARCH',
  displayName: 'List Channel Categories',
  description: 'Lists the channel categories (sidebar sections).',
  audience: 'both',
  aiMetadata: {
    description: 'Lists every channel category (sidebar section) with ID and name. Use to get the category ID that Create Channel requires. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  outputSchema: heartbeatOutputSchemas.categoryList,
  async run({ auth }) {
    const categories = heartbeatApi.recordList(
      await heartbeatApi.request<unknown>({ token: auth.secret_text, method: HttpMethod.GET, path: '/channelCategories', operation: 'list channel categories' }),
    );
    return { categories, count: categories.length };
  },
});
