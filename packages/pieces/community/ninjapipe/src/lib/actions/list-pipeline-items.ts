import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, extractItems, flattenArray, getAuth, ninjapipeCommon } from '../common';

export const listPipelineItems = createAction({
  auth: ninjapipeAuth,
  name: 'list_pipeline_items',
  displayName: 'List Pipeline Items',
  description: 'Retrieves a list of pipeline items.',
  props: {
    limit: ninjapipeCommon.limitProperty,
    search: ninjapipeCommon.searchProperty,
    statusFilter: ninjapipeCommon.statusFilterProperty,
    returnAll: Property.Checkbox({ displayName: 'Return All', description: 'Retrieve all items using pagination.', required: false, defaultValue: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number when not using Return All.', required: false, defaultValue: 1 }),
  },
  async run(context) {
    const auth = getAuth(context);
    const qs: Record<string, string> = { limit: String(context.propsValue.limit ?? 20), page: String(context.propsValue.page ?? 1) };
    if (context.propsValue.search) qs.search = context.propsValue.search;
    if (context.propsValue.statusFilter) qs.status = context.propsValue.statusFilter;
    if (context.propsValue.returnAll) {
      const results: unknown[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;
      while (hasMore) {
        const response = await ninjapipeApiCall<{ data?: unknown[] }>({ auth, method: HttpMethod.GET, path: '/pipeline_items', queryParams: { ...qs, limit: String(limit), page: String(page) } });
        const items = extractItems(response.body);
        results.push(...items);
        hasMore = items.length === limit && page < 1000;
        page++;
      }
      return flattenArray(results);
    }
    const response = await ninjapipeApiCall<{ data?: unknown[] }>({ auth, method: HttpMethod.GET, path: '/pipeline_items', queryParams: qs });
    const items = extractItems(response.body);
    return flattenArray(items);
  },
});
