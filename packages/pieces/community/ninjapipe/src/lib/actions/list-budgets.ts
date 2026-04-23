import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeAuth } from '../../';
import { ninjapipeApiCall, extractItems, flattenArray, getAuth, ninjapipeCommon } from '../common';

export const listBudgets = createAction({
  auth: ninjapipeAuth,
  name: 'list_budgets',
  displayName: 'List Budgets',
  description: 'Retrieves a list of budgets.',
  props: {
    limit: ninjapipeCommon.limitProperty,
    search: ninjapipeCommon.searchProperty,
    returnAll: Property.Checkbox({ displayName: 'Return All', description: 'Retrieve all budgets using pagination.', required: false, defaultValue: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number when not using Return All.', required: false, defaultValue: 1 }),
  },
  async run(context) {
    const auth = getAuth(context);
    const qs: Record<string, string> = { limit: String(context.propsValue.limit ?? 20), page: String(context.propsValue.page ?? 1) };
    if (context.propsValue.search) qs.search = context.propsValue.search;
    if (context.propsValue.returnAll) {
      const results: unknown[] = [];
      let page = 1;
      const limit = 100;
      let hasMore = true;
      while (hasMore) {
        const response = await ninjapipeApiCall<{ data?: unknown[] }>({ auth, method: HttpMethod.GET, path: '/budgets', queryParams: { ...qs, limit: String(limit), page: String(page) } });
        const items = extractItems(response.body);
        results.push(...items);
        hasMore = items.length === limit && page < 1000;
        page++;
      }
      return flattenArray(results);
    }
    const response = await ninjapipeApiCall<{ data?: unknown[] }>({ auth, method: HttpMethod.GET, path: '/budgets', queryParams: qs });
    const items = extractItems(response.body);
    return flattenArray(items);
  },
});
