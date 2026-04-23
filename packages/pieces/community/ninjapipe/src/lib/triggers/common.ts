import { DedupeStrategy, Polling } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { ninjapipeApiCall, extractItems, flattenCustomFields, getAuth } from '../common';

export function buildPolling(
  path: string,
  timestampField: string
): Polling<any, Record<string, never>> {
  return {
    strategy: DedupeStrategy.TIMEBASED,
    items: async ({ auth }) => {
      const a = getAuth({ auth });
      const response = await ninjapipeApiCall<{ data?: unknown[] }>({
        auth: a,
        method: HttpMethod.GET,
        path,
        queryParams: { limit: '100', sort: timestampField, order: 'asc' },
      });
      const items = extractItems(response.body);
      return items.map((item: any) => ({
        epochMilliSeconds: new Date(item[timestampField] ?? item.created_at ?? item.updated_at).getTime(),
        data: flattenCustomFields(item as Record<string, unknown>),
      }));
    },
  };
}
